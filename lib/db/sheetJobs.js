import { ObjectId } from 'mongodb';
import client from '@/lib/db/client';
import { fieldGroup, flattenJob } from '@/lib/jobsSheetParser';
import { diffByKey } from '@/lib/sheetDiff';

// The on-call sheet's `Jobs` tab (docs/ON-CALL-SHEET-SYNC.md, stage 2).
//
// `sheet-jobs`: the jobs as of the last refresh, one doc per jobName:
//   { jobName, driver, days: { sun: { start, hours, miles }, … }, description,
//     weekHours, seniority, sheetOrder, firstSeenAt, updated_at, removedAt? }
//   A job that leaves the sheet gets `removedAt`; it's never deleted, so its
//   history still has a job to belong to.
// `sheet-job-changes`: one row per field that changed between refreshes:
//   { jobName, kind: 'added'|'removed'|'changed', field, group, from, to,
//     seenAt, source: 'refresh'|'ping'|'cron' }
//   The first refresh is a baseline and records nothing.

const JOBS = 'sheet-jobs';
const CHANGES = 'sheet-job-changes';

const keyOf = (row) => row.jobName.toUpperCase();
const SNAPSHOT_FIELDS = ['jobName', 'driver', 'days', 'description', 'weekHours', 'seniority'];

// Saves the tab's rows and records what changed. A job name listed twice keeps
// its first row (jobName is the snapshot's key). Returns
// { baseline, changes, added, removed, changedJobs, duplicates }.
export async function saveJobsSnapshot(sheetRows, { source = 'refresh' } = {}) {
  try {
    const db = client.db();
    const seen = new Set();
    const duplicates = [];
    const rows = sheetRows.filter((row) => {
      if (!seen.has(keyOf(row))) return seen.add(keyOf(row));
      duplicates.push(row.jobName);
      return false;
    });
    await recordJobsSync({ source, at: new Date().toISOString(), duplicates });

    const current = await db.collection(JOBS).find({ removedAt: { $exists: false } }).toArray();
    const known = await db.collection(JOBS).estimatedDocumentCount();
    const baseline = known === 0;
    const now = new Date().toISOString();

    const { added, removed, changed } = diffByKey(current, rows, { keyOf, flatten: flattenJob });
    const jobNameOf = (key) =>
      rows.find((row) => keyOf(row) === key)?.jobName ??
      current.find((row) => keyOf(row) === key)?.jobName ??
      key;

    const sameOrder = rows.every(
      (row, index) => current.find((job) => keyOf(job) === keyOf(row))?.sheetOrder === index
    );
    if (!baseline && !added.length && !removed.length && !changed.length && sameOrder) {
      return { baseline: false, changes: 0, added: 0, removed: 0, changedJobs: 0, duplicates };
    }

    if (!baseline) {
      const changes = [
        ...added.map(({ row }) => ({ jobName: row.jobName, kind: 'added', field: null, from: '', to: row.driver })),
        ...removed.map(({ row }) => ({ jobName: row.jobName, kind: 'removed', field: null, from: row.driver, to: '' })),
        ...changed.map(({ key, field, from, to }) => ({
          jobName: jobNameOf(key.replace(/#\d+$/, '')),
          kind: 'changed',
          field,
          group: fieldGroup(field),
          from,
          to,
        })),
      ].map((change) => ({ ...change, seenAt: now, source }));
      if (changes.length) await db.collection(CHANGES).insertMany(changes);
    }

    const operations = [];
    rows.forEach((row, index) => {
      operations.push({
        updateOne: {
          filter: { jobName: row.jobName },
          update: {
            $set: {
              ...Object.fromEntries(SNAPSHOT_FIELDS.map((field) => [field, row[field]])),
              sheetOrder: index,
              updated_at: now,
            },
            $unset: { removedAt: '' },
            $setOnInsert: { firstSeenAt: now },
          },
          upsert: true,
        },
      });
    });
    for (const { row } of removed) {
      operations.push({
        updateOne: { filter: { jobName: row.jobName }, update: { $set: { removedAt: now } } },
      });
    }
    if (operations.length) await db.collection(JOBS).bulkWrite(operations, { ordered: false });

    return {
      baseline,
      changes: baseline ? 0 : added.length + removed.length + changed.length,
      added: baseline ? 0 : added.length,
      removed: baseline ? 0 : removed.length,
      changedJobs: baseline ? 0 : new Set(changed.map(({ key }) => key)).size,
      duplicates,
    };
  } catch (error) {
    console.error('Error saving the jobs tab:', error);
    throw error;
  }
}

// The jobs still on the sheet, in sheet order.
export async function getSheetJobs() {
  const db = client.db();
  return db
    .collection(JOBS)
    .find({ removedAt: { $exists: false } })
    .sort({ sheetOrder: 1 })
    .toArray();
}

// Newest first. `before` ({ seenAt, id } of the last change shown) pages back:
// one refresh's changes share a seenAt, so the id breaks the tie. `job` and
// `group` filter.
export async function getJobChanges({ before, job, group, limit = 100 } = {}) {
  const db = client.db();
  const filter = {};
  if (before) {
    filter.$or = [
      { seenAt: { $lt: before.seenAt } },
      { seenAt: before.seenAt, _id: { $lt: new ObjectId(before.id) } },
    ];
  }
  if (job) filter.jobName = job;
  if (group) filter.group = group;
  return db
    .collection(CHANGES)
    .find(filter)
    .sort({ seenAt: -1, _id: -1 })
    .limit(limit)
    .toArray();
}

// For the stage 3 alerts: changes recorded after `since` (ISO), or all of them.
export async function countJobChangesSince(since) {
  const db = client.db();
  return db.collection(CHANGES).countDocuments(since ? { seenAt: { $gt: since } } : {});
}

export async function latestJobChange() {
  const db = client.db();
  return db.collection(CHANGES).findOne({}, { sort: { seenAt: -1, _id: -1 } });
}

// When the Jobs tab was last read and by what, in `sync-state` (the collection
// stage 3's sync lock and ping times also live in): { _id: 'jobs',
// lastSyncedAt, lastSource, duplicates }.
async function recordJobsSync({ source, at, duplicates }) {
  const db = client.db();
  await db
    .collection('sync-state')
    .updateOne(
      { _id: 'jobs' },
      { $set: { lastSyncedAt: at, lastSource: source, duplicates } },
      { upsert: true }
    );
}

export async function getJobsSyncState() {
  const db = client.db();
  const state = await db.collection('sync-state').findOne({ _id: 'jobs' });
  return state ? { lastSyncedAt: state.lastSyncedAt, lastSource: state.lastSource, duplicates: state.duplicates ?? [] } : null;
}

export function serializeSheetJobs(jobs) {
  return jobs.map((job) => ({ ...job, _id: job._id.toString() }));
}

export function serializeJobChanges(changes) {
  return changes.map((change) => ({ ...change, _id: change._id.toString() }));
}
