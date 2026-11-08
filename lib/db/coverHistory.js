import client from '@/lib/db/client';
import { currentBidWeek } from '@/lib/bidDay';
import { driverTrends, findPatterns, jobTrends, readWeek } from '@/lib/coverHistory';
import { getCoverBidJobWeeks } from '@/lib/db/coverBidJobs';
import { getBidDayOverrides } from '@/lib/db/coverBidDays';
import { getHiddenJobKeys } from '@/lib/db/coverBidJobHides';
import { getCoverListTotals } from '@/lib/db/coverListTotals';
import { serializeCoverJobChanges } from '@/lib/db/coverJobChanges';
import { displayName } from '@/lib/names';
import { todayInNewYork } from '@/lib/onCallSheet';

// Cover History's data (/admin/cover/history, docs/COVER-BIDDING.md "Covers
// hub and History"): the weeks already bid on, read and interpreted by
// lib/coverHistory.js. Admin-only (the Covers area): it names drivers. Read
// on each visit; nothing is stored.

export const HISTORY_RANGES = ['8', '12', '26', '52', 'all'];
export const DEFAULT_RANGE = '12';
// A week's change log on the page, oldest first: enough for any real week
// (the busiest so far had under 500 job changes).
const LOG_LIMIT = 600;

const countByWeek = (collection, from, to) =>
  client
    .db()
    .collection(collection)
    .aggregate([
      { $match: { weekEnding: { $gte: from, $lte: to } } },
      { $group: { _id: '$weekEnding', count: { $sum: 1 } } },
    ])
    .toArray()
    .then((rows) => new Map(rows.map((row) => [row._id, row.count])));

// The drill-down week's change log: job changes and pick list changes, merged
// oldest first.
async function weekLog(weekEnding) {
  const db = client.db();
  const [changes, events] = await Promise.all([
    db.collection('cover-job-changes').find({ weekEnding }).sort({ seenAt: 1 }).limit(LOG_LIMIT).toArray(),
    db
      .collection('cover-bid-pick-events')
      .find({ weekEnding }, { projection: { name: 1, field: 1, from: 1, to: 1, seenAt: 1 } })
      .sort({ seenAt: 1 })
      .limit(LOG_LIMIT)
      .toArray(),
  ]);
  const log = [
    ...serializeCoverJobChanges(changes).map((change) => ({ type: 'job', ...change })),
    ...events.map((event) => ({ type: 'pick', ...event, _id: event._id.toString() })),
  ];
  return {
    entries: log.sort((a, b) => String(a.seenAt).localeCompare(String(b.seenAt))),
    truncated: changes.length === LOG_LIMIT || events.length === LOG_LIMIT,
  };
}

// → { weeks (every week bid on, newest first, for the calendar), range,
//     summaries (oldest first), jobs, drivers, patterns, detail } or
//     { weeks: [] } when nothing is saved yet. `detail` is `week` (a week in
//     the range, else the newest) read in full, with its change log.
export async function getCoverHistory({ range = DEFAULT_RANGE, week } = {}) {
  const current = currentBidWeek(todayInNewYork());
  const weeks = (await getCoverBidJobWeeks()).filter((weekEnding) => weekEnding <= current);
  if (weeks.length === 0) return { weeks: [], range };

  const chosen = HISTORY_RANGES.includes(range) ? range : DEFAULT_RANGE;
  const inRange = chosen === 'all' ? weeks : weeks.slice(0, Number(chosen));
  const to = inRange[0];
  const from = inRange.at(-1);
  const db = client.db();

  const [jobs, picks, hiddenKeys, bidDays, listTotals, jobChanges, pickChanges] = await Promise.all([
    db
      .collection('cover-bid-jobs')
      .find(
        { weekEnding: { $gte: from, $lte: to } },
        { projection: { weekEnding: 1, jobNumber: 1, name: 1, coverReason: 1, sheetHidden: 1, source: 1, sortOrder: 1 } },
      )
      .sort({ weekEnding: 1, sortOrder: 1 })
      .toArray(),
    db
      .collection('cover-bid-picks')
      .find({ weekEnding: { $gte: from, $lte: to } }, { projection: { weekEnding: 1, rows: 1 } })
      .toArray(),
    getHiddenJobKeys(from),
    getBidDayOverrides(from),
    getCoverListTotals(from),
    countByWeek('cover-job-changes', from, to),
    countByWeek('cover-bid-pick-events', from, to),
  ]);

  const jobsByWeek = new Map();
  for (const job of jobs) {
    if (!jobsByWeek.has(job.weekEnding)) jobsByWeek.set(job.weekEnding, []);
    jobsByWeek.get(job.weekEnding).push(job);
  }
  const rowsByWeek = new Map(picks.map((doc) => [doc.weekEnding, doc.rows ?? []]));
  const totalsByWeek = new Map(listTotals.filter((doc) => doc.weekEnding <= to).map((doc) => [doc.weekEnding, doc]));

  const read = [...inRange].reverse().map((weekEnding) =>
    readWeek(
      {
        weekEnding,
        jobs: jobsByWeek.get(weekEnding) ?? [],
        rows: rowsByWeek.get(weekEnding) ?? null,
        jobChanges: jobChanges.get(weekEnding) ?? 0,
        pickChanges: pickChanges.get(weekEnding) ?? 0,
        listTotals: totalsByWeek.get(weekEnding) ?? null,
        bidMoved: Boolean(bidDays[weekEnding]),
      },
      hiddenKeys,
    ),
  );

  const summaries = read.map((entry) => entry.summary);
  const jobRows = jobTrends(read, [...totalsByWeek.values()]);
  const driverRows = driverTrends(read);
  const patterns = findPatterns(summaries, jobRows, driverRows, { names: displayName });

  const detailWeek = inRange.includes(week) ? week : to;
  const detailRead = read.find((entry) => entry.summary.weekEnding === detailWeek);
  const log = await weekLog(detailWeek);

  return {
    weeks,
    range: chosen,
    summaries,
    jobs: jobRows,
    drivers: driverRows.map((driver) => ({ ...driver, name: displayName(driver.name) })),
    patterns,
    detail: {
      weekEnding: detailWeek,
      summary: detailRead.summary,
      jobs: detailRead.jobs.map((job) => ({ ...job, name: displayName(job.name), coveredBy: displayName(job.coveredBy) })),
      drivers: detailRead.drivers.map((driver) => ({ ...driver, name: displayName(driver.name) })),
      bidDate: bidDays[detailWeek] ?? null,
      listTotals: totalsByWeek.get(detailWeek) ?? null,
      log,
    },
  };
}
