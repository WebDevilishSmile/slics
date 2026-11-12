import client from '@/lib/db/client';
import { DEFAULT_HUB_ID } from '@/lib/hubScope';

// Anonymous weekly totals of the drivers' cover lists (docs/COVER-BIDDING.md
// "Covers hub and History"). The lists themselves (`cover-preferences`) are
// deleted COVER_LIST_KEEP_DAYS after their week, so Cover History keeps these
// instead:
//   `cover-list-totals`: { weekEnding, lists (how many drivers kept one),
//     jobs: [{ jobKey, jobNumber, lists, first }], computedAt: Date }
// `lists` is how many lists held the job, `first` on how many it was the #1
// entry. Counted from the raw entries, not coverListStatus: by the time a
// week is history every job on it is taken or gone. No userId and no names,
// ever: a total can't say whose list it came from.

const LISTS = 'cover-preferences';
const TOTALS = 'cover-list-totals';

// Recounts every week that still has lists and saves its totals. A week whose
// lists are gone (the TTL) is never touched, so its last count stands; the
// daily cron runs it (app/api/cron/on-call-sheet-sync), so the count kept is
// at most a day older than the lists' final state. → how many weeks it saved.
export async function snapshotCoverListTotals() {
  const db = client.db();
  const rows = await db
    .collection(LISTS)
    .aggregate([
      { $project: { weekEnding: 1, entries: { $ifNull: ['$entries', []] } } },
      { $unwind: { path: '$entries', includeArrayIndex: 'index', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { weekEnding: '$weekEnding', jobKey: '$entries.jobKey' },
          jobNumber: { $first: '$entries.jobNumber' },
          lists: { $addToSet: '$_id' },
          first: { $sum: { $cond: [{ $eq: ['$index', 0] }, 1, 0] } },
        },
      },
      {
        $group: {
          _id: '$_id.weekEnding',
          docs: { $addToSet: '$lists' },
          jobs: {
            $push: { jobKey: '$_id.jobKey', jobNumber: '$jobNumber', lists: { $size: '$lists' }, first: '$first' },
          },
        },
      },
    ])
    .toArray();

  const computedAt = new Date();
  const writes = rows
    .filter((row) => typeof row._id === 'string')
    .map((row) => {
      // How many distinct lists the week had, empty ones included.
      const lists = new Set(row.docs.flat().map((id) => id.toString())).size;
      // An empty list unwinds to one row with no job: it counts as a list only.
      const jobs = row.jobs.filter((job) => job.jobKey).sort((a, b) => b.lists - a.lists || b.first - a.first);
      return {
        updateOne: {
          filter: { weekEnding: row._id },
          update: { $set: { lists, jobs, computedAt }, $setOnInsert: { hubId: DEFAULT_HUB_ID } },
          upsert: true,
        },
      };
    })
    .filter((write) => write.updateOne.update.$set.lists > 0);

  if (writes.length) await db.collection(TOTALS).bulkWrite(writes, { ordered: false });
  return writes.length;
}

// Every week's totals from `weekEndingFrom` (or all), oldest first, as
// { weekEnding, lists, jobs }.
export async function getCoverListTotals(weekEndingFrom) {
  const filter = weekEndingFrom ? { weekEnding: { $gte: weekEndingFrom } } : {};
  const docs = await client
    .db()
    .collection(TOTALS)
    .find(filter, { projection: { _id: 0, weekEnding: 1, lists: 1, jobs: 1 } })
    .sort({ weekEnding: 1 })
    .toArray();
  return docs;
}
