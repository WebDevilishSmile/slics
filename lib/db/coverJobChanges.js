import { ObjectId } from 'mongodb';
import client from '@/lib/db/client';
import { jobKey } from '@/lib/coverBidJobRow';
import { DAY_FIELDS } from '@/lib/dayFormat';
import { diffByKey } from '@/lib/sheetDiff';
import { seenWindow } from '@/lib/db/seenWindow';
import { DEFAULT_HUB_ID } from '@/lib/hubScope';

// What changed on each week's cover tab between refreshes
// (docs/ON-CALL-SHEET-SYNC.md, "Alerts"), the cover weeks' version of
// `sheet-job-changes`.
//
// `cover-job-changes`: one row per change:
//   { weekEnding, jobNumber, kind: 'posted'|'added'|'removed'|'changed',
//     field, from, to, jobs?, seenAt (ISO), source: 'refresh'|'ping'|'cron' }
//   'posted' is a week's first save, with `jobs` (how many) and no job.
//   'added' and 'removed' carry the job's name and cover reason in to/from.
//   'changed' is one field: name, assignedDriver, coverReason, sun … sat or
//   description.
//   `sheetHidden` (since 2026-10-22): the job's row is hidden in the sheet,
//   so drivers aren't told about it (lib/coverNotices.js).
// Admin-only: rows name drivers and leave reasons, like the tab itself. A push
// says only job numbers and what kind of field changed (lib/pushEvents.js).

const CHANGES = 'cover-job-changes';
const FIELDS = ['name', 'assignedDriver', 'coverReason', ...DAY_FIELDS, 'description'];

const keyOf = (job) => jobKey(job.jobNumber);
const flattenCoverJob = (job) => Object.fromEntries(FIELDS.map((field) => [field, job[field] ?? '']));
const summaryOf = (job) => [job.name, job.coverReason].filter(Boolean).join(' · ');

// The change rows from the week's saved jobs (`before`) to the sheet's
// (`after`), keyed by job number like the hides; nothing is saved. A week with
// no saved jobs is one 'posted' row. A job moved up or down the tab isn't a
// change. Pure.
export function diffCoverJobs(weekEnding, before, after, { source, at }) {
  const stamp = (change) => ({ weekEnding, ...change, seenAt: at, source });
  if (before.length === 0) {
    return [stamp({ jobNumber: null, kind: 'posted', field: null, from: '', to: '', jobs: after.length })];
  }
  const { added, removed, changed } = diffByKey(before, after, { keyOf, flatten: flattenCoverJob });
  // diffByKey numbers a repeated job number "SH16#2"; the row keeps the sheet's.
  const numberOf = (key) => {
    const base = key.replace(/#\d+$/, '');
    return after.find((job) => keyOf(job) === base)?.jobNumber ?? base;
  };
  // A changed job is hidden if the sheet hides its row now.
  const hiddenNow = (key) => Boolean(after.find((job) => keyOf(job) === key.replace(/#\d+$/, ''))?.sheetHidden);
  return [
    ...added.map(({ row }) => ({
      jobNumber: row.jobNumber,
      kind: 'added',
      field: null,
      from: '',
      to: summaryOf(row),
      sheetHidden: Boolean(row.sheetHidden),
    })),
    ...removed.map(({ row }) => ({
      jobNumber: row.jobNumber,
      kind: 'removed',
      field: null,
      from: summaryOf(row),
      to: '',
      sheetHidden: Boolean(row.sheetHidden),
    })),
    ...changed.map(({ key, field, from, to }) => ({
      jobNumber: numberOf(key),
      kind: 'changed',
      field,
      from,
      to,
      sheetHidden: hiddenNow(key),
    })),
  ].map(stamp);
}

export async function saveCoverJobChanges(changes) {
  if (changes.length === 0) return;
  // The rows the caller keeps (pushes, the refresh's answer) stay as they were.
  await client
    .db()
    .collection(CHANGES)
    .insertMany(changes.map((change) => ({ hubId: DEFAULT_HUB_ID, ...change })));
}

// Newest first, a page at a time. `before` ({ seenAt, id } of the last change
// shown) pages back: one refresh's changes share a seenAt, so the id breaks
// the tie.
export async function getCoverJobChanges({ before, limit = 20 } = {}) {
  const filter = {};
  if (before) {
    filter.$or = [
      { seenAt: { $lt: before.seenAt } },
      { seenAt: before.seenAt, _id: { $lt: new ObjectId(before.id) } },
    ];
  }
  return client
    .db()
    .collection(CHANGES)
    .find(filter)
    .sort({ seenAt: -1, _id: -1 })
    .limit(limit)
    .toArray();
}

const unseenFilter = (since) => (since ? { seenAt: { $gt: since } } : {});

// What's new for an admin whose mark is `since` (ISO, or null for everything),
// for the /admin banner and the menu badge: { count, latest (the 3 newest),
// week (the newest change's week, where "View changes" opens) }.
export async function getUnseenCoverJobChanges(since) {
  const collection = client.db().collection(CHANGES);
  const filter = unseenFilter(since);
  const [count, latest] = await Promise.all([
    collection.countDocuments(filter),
    collection.find(filter).sort({ seenAt: -1, _id: -1 }).limit(3).toArray(),
  ]);
  return { count, latest: serializeCoverJobChanges(latest), week: latest[0]?.weekEnding ?? null };
}

// The changes to weeks from `weekEndingFrom` on seen after `since` (ISO), for
// the drivers' "Cover jobs" notification (lib/coverNotices.js), newest first:
// only the fields it may say, never a name or a reason.
export async function getCoverJobChangeRowsSince(since, weekEndingFrom, limit = 2000) {
  return client
    .db()
    .collection(CHANGES)
    .find(
      { seenAt: { $gt: since }, weekEnding: { $gte: weekEndingFrom } },
      // `from`/`to` only so a push can drop a change that was undone; it
      // never says them.
      { projection: { weekEnding: 1, jobNumber: 1, kind: 1, field: 1, from: 1, to: 1, jobs: 1, sheetHidden: 1, seenAt: 1 } },
    )
    .sort({ seenAt: -1, _id: -1 })
    .limit(limit)
    .toArray();
}

// The same changes as rows for an admin push's summary, newest first, for
// weeks from `weekEndingFrom` on (a week that's over isn't news). `from`/`to`
// only so the summary can drop a change that was undone; a push never says
// them. Capped high: the summary replays each job's rows in order.
export async function getUnseenCoverJobChangeRows(since, weekEndingFrom, limit = 2000) {
  return client
    .db()
    .collection(CHANGES)
    .find(
      { ...unseenFilter(since), weekEnding: { $gte: weekEndingFrom } },
      { projection: { weekEnding: 1, jobNumber: 1, kind: 1, field: 1, from: 1, to: 1, jobs: 1, seenAt: 1 } },
    )
    .sort({ seenAt: -1, _id: -1 })
    .limit(limit)
    .toArray();
}

// A job's NAME filled, cleared or swapped: a pick, not a change to the job.
// The admins' "Cover jobs" notification leaves these to "Cover picks"
// (lib/pushEvents.js).
const PICK_ROW = { kind: 'changed', field: 'name' };
export const isPickRow = (row) => row.kind === 'changed' && row.field === 'name';

// For the admin sheet digests (lib/sheetNotices.js): the oldest and newest
// change seen after `since` on weeks from `weekEndingFrom` on. `picks` true
// for the pick rows above, false for everything else. → { oldest, newest }.
export function getCoverJobChangeWindow(since, weekEndingFrom, { picks = false } = {}) {
  return seenWindow(client.db().collection(CHANGES), {
    seenAt: { $gt: since },
    weekEnding: { $gte: weekEndingFrom },
    ...(picks ? PICK_ROW : { $nor: [PICK_ROW] }),
  });
}

// The pick rows seen after `since`, oldest first: { weekEnding, jobNumber,
// from, to }. Names, so they stay on the server: the digest only counts jobs.
export async function getCoverPickRowsSince(since, weekEndingFrom, limit = 2000) {
  return client
    .db()
    .collection(CHANGES)
    .find(
      { seenAt: { $gt: since }, weekEnding: { $gte: weekEndingFrom }, ...PICK_ROW },
      { projection: { weekEnding: 1, jobNumber: 1, from: 1, to: 1 } },
    )
    .sort({ seenAt: 1, _id: 1 })
    .limit(limit)
    .toArray();
}

export function serializeCoverJobChanges(changes) {
  return changes.map((change) => ({ ...change, _id: change._id.toString() }));
}
