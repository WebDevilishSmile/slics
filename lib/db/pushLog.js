import { ObjectId } from 'mongodb';

import { recordAdminAction } from '@/lib/db/adminAudit';
import client from '@/lib/db/client';
import { HttpError } from '@/lib/httpError';

// `push-log`: one row per push notification send (docs/PUSH-NOTIFICATIONS.md,
// the send log; docs/SUPER-ADMIN-HUB.md stage C), written by lib/push.js:
//   { at: Date, type (a PUSH_TYPES key, or null), source: 'event' | 'test' |
//     'sample' | 'compose', title, recipients (accounts sent to), devices,
//     sent, failed, gone (devices the push service said are gone),
//     errors: [{ host, status }], by: { id, name } | null }
// No recipient ids and no body text: the super admin's notifications page
// reads it for counts and failures, nothing more. A TTL index on `at`
// (scripts/createIndexes.js) deletes rows after PUSH_LOG_KEEP_DAYS.
//
// `failed` counts every device that didn't take the push, gone ones included.
// A gone device (404/410: unsubscribed, expired, the app removed) is removed by
// recordPushResults and isn't an error, so the real errors are `failed - gone`
// (`errored`), worked out on read. Only those raise a warning.
//
// The super admin can clear the warning ("Clear" on the notifications page):
// one `app-settings` document, { _id: 'push', failuresClearedAt: Date,
// clearedBy: { id, name }, undo: { at, by } | null }, and failures at or
// before the mark stop counting. The log rows stay. `undo` is the mark before
// the last clear, there only until it's used; deleting the document is the
// rollback.

export const PUSH_LOG_KEEP_DAYS = 90;
export const PUSH_LOG_PAGE_SIZE = 20;

const log = () => client.db().collection('push-log');
const settings = () => client.db().collection('app-settings');
const MARK_ID = 'push';

// A row's real errors, in an aggregation and in a query.
const ERRORED = { $subtract: [{ $ifNull: ['$failed', 0] }, { $ifNull: ['$gone', 0] }] };
const HAS_ERRORS = { $expr: { $gt: [ERRORED, 0] } };
const erroredOf = (row) => Math.max(0, (row.failed ?? 0) - (row.gone ?? 0));

// Never throws: a send log that can't be written mustn't fail the send.
export async function recordPushSend(row) {
  try {
    await log().insertOne({ at: new Date(), ...row });
  } catch (error) {
    console.error('Error recording a push send:', error);
  }
}

// → { at: Date, by: { name } | null, canUndo } | null
async function readClearMark() {
  const doc = await settings().findOne({ _id: MARK_ID });
  if (!(doc?.failuresClearedAt instanceof Date)) return null;
  return {
    at: doc.failuresClearedAt,
    by: doc.clearedBy?.name ? { name: doc.clearedBy.name } : null,
    canUndo: Object.hasOwn(doc, 'undo'),
  };
}

const toJson = (row, mark) => {
  const errored = erroredOf(row);
  return {
    _id: String(row._id),
    at: row.at instanceof Date ? row.at.toISOString() : row.at,
    type: row.type ?? null,
    source: row.source ?? 'event',
    title: row.title ?? '',
    recipients: row.recipients ?? 0,
    devices: row.devices ?? 0,
    sent: row.sent ?? 0,
    failed: row.failed ?? 0,
    gone: row.gone ?? 0,
    errored,
    // Its errors were cleared from the warning.
    cleared: Boolean(errored > 0 && mark && row.at <= mark.at),
    errors: row.errors ?? [],
    by: row.by?.name ? { name: row.by.name } : null,
  };
};

// Newest first, a page at a time: `before` is the last row id already shown.
// → { rows, hasMore }.
export async function getPushLog({ before = null, limit = PUSH_LOG_PAGE_SIZE } = {}) {
  let filter = {};
  if (before) {
    if (!ObjectId.isValid(before)) return { rows: [], hasMore: false };
    const anchor = await log().findOne({ _id: new ObjectId(before) }, { projection: { at: 1 } });
    if (!anchor) return { rows: [], hasMore: false };
    filter = { $or: [{ at: { $lt: anchor.at } }, { at: anchor.at, _id: { $lt: anchor._id } }] };
  }
  const [rows, mark] = await Promise.all([
    log()
      .find(filter)
      .sort({ at: -1, _id: -1 })
      .limit(limit + 1)
      .toArray(),
    readClearMark(),
  ]);
  return { rows: rows.slice(0, limit).map((row) => toJson(row, mark)), hasMore: rows.length > limit };
}

// Counts for the notifications page, the hub card and System health: sends
// over the last day and week, the week per kind, the newest failure, and the
// failures the warning counts (`open`: this week's, after the clear mark).
// → { day: { sends, sent, failed, gone, errored }, week: { … }, byType: {
//     [type]: { sends, sent, lastAt } }, lastFailure: row | null, open: {
//     sends, failed, since }, cleared: { at, by, canUndo } | null }
export async function getPushStats() {
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const mark = await readClearMark();
  const openSince = mark && mark.at > weekAgo ? mark.at : weekAgo;

  const totals = (match) =>
    log()
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            sends: { $sum: 1 },
            sent: { $sum: '$sent' },
            failed: { $sum: '$failed' },
            gone: { $sum: '$gone' },
            errored: { $sum: ERRORED },
          },
        },
      ])
      .next();

  const [day, week, open, byType, lastFailure] = await Promise.all([
    totals({ at: { $gte: dayAgo } }),
    totals({ at: { $gte: weekAgo } }),
    totals({ at: { $gt: openSince }, ...HAS_ERRORS }),
    log()
      .aggregate([
        { $match: { at: { $gte: weekAgo }, source: 'event' } },
        { $group: { _id: '$type', sends: { $sum: 1 }, sent: { $sum: '$sent' }, lastAt: { $max: '$at' } } },
      ])
      .toArray(),
    log().find(HAS_ERRORS).sort({ at: -1 }).limit(1).next(),
  ]);

  const pick = (row) => ({
    sends: row?.sends ?? 0,
    sent: row?.sent ?? 0,
    failed: row?.failed ?? 0,
    gone: row?.gone ?? 0,
    errored: row?.errored ?? 0,
  });
  return {
    day: pick(day),
    week: pick(week),
    byType: Object.fromEntries(
      byType
        .filter((row) => row._id)
        .map((row) => [row._id, { sends: row.sends, sent: row.sent, lastAt: row.lastAt.toISOString() }]),
    ),
    lastFailure: lastFailure ? toJson(lastFailure, mark) : null,
    open: { sends: open?.sends ?? 0, failed: open?.errored ?? 0, since: openSince.toISOString() },
    cleared: mark ? { at: mark.at.toISOString(), by: mark.by, canUndo: mark.canUndo } : null,
  };
}

// "Clear" on /admin/super/notifications: failures up to now stop raising the
// warning. Written to admin_audit first, like every consequential admin
// change. → getPushStats()
export async function clearPushFailures(actor) {
  const [doc, stats] = await Promise.all([settings().findOne({ _id: MARK_ID }), getPushStats()]);
  if (stats.open.failed === 0) throw new HttpError(409, 'There are no failures to clear.');

  await recordAdminAction({
    actor,
    action: 'push.failuresCleared',
    targetType: 'push',
    targetId: 'failures',
    targetName: 'Push failures',
    to: String(stats.open.failed),
  });
  const previous =
    doc?.failuresClearedAt instanceof Date ? { at: doc.failuresClearedAt, by: doc.clearedBy ?? null } : null;
  await settings().updateOne(
    { _id: MARK_ID },
    {
      $set: {
        failuresClearedAt: new Date(),
        clearedBy: { id: actor?.id ?? null, name: actor?.name ?? null },
        undo: previous,
      },
    },
    { upsert: true },
  );
  return getPushStats();
}

// "Undo" right after a clear: puts the mark back where it was (or removes
// it), so those failures count again. → getPushStats()
export async function undoClearPushFailures(actor) {
  const doc = await settings().findOne({ _id: MARK_ID });
  if (!doc || !Object.hasOwn(doc, 'undo')) throw new HttpError(409, 'There is nothing to undo.');

  await recordAdminAction({
    actor,
    action: 'push.failuresClearUndone',
    targetType: 'push',
    targetId: 'failures',
    targetName: 'Push failures',
  });
  const update = doc.undo?.at
    ? { $set: { failuresClearedAt: doc.undo.at, clearedBy: doc.undo.by ?? null }, $unset: { undo: '' } }
    : { $unset: { failuresClearedAt: '', clearedBy: '', undo: '' } };
  await settings().updateOne({ _id: MARK_ID }, update);
  return getPushStats();
}

// When each kind last went out at all (not only this week), for the kinds list.
export async function getLastSentByType() {
  const rows = await log()
    .aggregate([
      { $match: { source: 'event', sent: { $gt: 0 } } },
      { $group: { _id: '$type', lastAt: { $max: '$at' } } },
    ])
    .toArray();
  return Object.fromEntries(rows.filter((row) => row._id).map((row) => [row._id, row.lastAt.toISOString()]));
}
