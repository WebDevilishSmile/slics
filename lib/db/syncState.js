import { randomUUID } from 'crypto';
import client from '@/lib/db/client';

// `sync-state`: bookkeeping for reading the on-call sheet
// (docs/ON-CALL-SHEET-SYNC.md, stage 3). One doc per sync target, keyed
// `jobs` or `week:YYYY-MM-DD`, plus `ping` for the sheet's webhook:
//   { _id: 'jobs', lastSyncedAt, lastSource, duplicates,   (lib/db/sheetJobs.js)
//     lockedUntil, lockToken, pending, lastRunAt, lastOutcome, lastError }
//   { _id: 'ping', lastPingAt, lastPing }
//
// The lock is a lease: whoever holds it re-reads that part of the sheet, and a
// ping that finds it held sets `pending` so the holder reads once more. It
// expires on its own, so a crashed function never blocks the next ping.

const SYNC_STATE = 'sync-state';
const DUPLICATE_KEY = 11000;

// Takes the lock on `target` for `leaseMs`. Returns { token } when taken, or
// { queued: true } when someone else holds it, in which case they've been told
// to read again before letting go.
export async function acquireSyncLock(target, { leaseMs = 60_000 } = {}) {
  const collection = client.db().collection(SYNC_STATE);
  // Two tries: the holder can let go between our failed take and our `pending`.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const now = new Date();
    const token = randomUUID();
    try {
      await collection.findOneAndUpdate(
        { _id: target, $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lte: now } }] },
        { $set: { lockedUntil: new Date(now.getTime() + leaseMs), lockToken: token, pending: false } },
        { upsert: true }
      );
      return { token };
    } catch (error) {
      // The doc exists and the filter didn't match it: the lock is held.
      if (error?.code !== DUPLICATE_KEY) throw error;
    }
    const { matchedCount } = await collection.updateOne(
      { _id: target, lockedUntil: { $gt: new Date() } },
      { $set: { pending: true } }
    );
    if (matchedCount === 1) return { queued: true };
  }
  return { queued: true };
}

// After a read: lets go of the lock and records how it went, unless a ping
// came in meanwhile. Returns true when released; false means `pending` was set,
// the lease has been renewed, and the holder should read again.
export async function releaseSyncLock(target, token, { outcome, error = null, leaseMs = 60_000 }) {
  const collection = client.db().collection(SYNC_STATE);
  const now = new Date();
  const record = {
    lastRunAt: now.toISOString(),
    lastOutcome: outcome,
    lastError: error ? { message: error, at: now.toISOString() } : null,
  };
  const released = await collection.findOneAndUpdate(
    { _id: target, lockToken: token, pending: { $ne: true } },
    { $set: record, $unset: { lockedUntil: '', lockToken: '' } }
  );
  if (released) return true;

  const { matchedCount } = await collection.updateOne(
    { _id: target, lockToken: token },
    { $set: { ...record, pending: false, lockedUntil: new Date(now.getTime() + leaseMs) } }
  );
  // matchedCount 0: the lease ran out and someone else took it; they'll read.
  return matchedCount === 0;
}

// Lets go no matter what's pending (after the last allowed pass). The flag is
// left set, so the next ping or the daily cron picks it up.
export async function forceReleaseSyncLock(target, token) {
  await client
    .db()
    .collection(SYNC_STATE)
    .updateOne({ _id: target, lockToken: token }, { $unset: { lockedUntil: '', lockToken: '' } });
}

// `ping` is the webhook's hint ({ tab } or { changeType }), kept for /admin/jobs.
export async function recordSheetPing(ping) {
  await client
    .db()
    .collection(SYNC_STATE)
    .updateOne(
      { _id: 'ping' },
      { $set: { lastPingAt: new Date().toISOString(), lastPing: ping } },
      { upsert: true }
    );
}
