import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';

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

export const PUSH_LOG_KEEP_DAYS = 90;
export const PUSH_LOG_PAGE_SIZE = 20;

const log = () => client.db().collection('push-log');

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

const toJson = (row) => ({
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
  errored: erroredOf(row),
  errors: row.errors ?? [],
  by: row.by?.name ? { name: row.by.name } : null,
});

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
  const rows = await log()
    .find(filter)
    .sort({ at: -1, _id: -1 })
    .limit(limit + 1)
    .toArray();
  return { rows: rows.slice(0, limit).map(toJson), hasMore: rows.length > limit };
}

// Counts for the notifications page and the hub card: sends and failures over
// the last day and week, the week per kind, and the newest failure.
// → { day: { sends, sent, failed, gone, errored }, week: { … }, byType: {
//     [type]: { sends, sent, lastAt } }, lastFailure: row | null }
export async function getPushStats() {
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const totals = (since) =>
    log()
      .aggregate([
        { $match: { at: { $gte: since } } },
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

  const [day, week, byType, lastFailure] = await Promise.all([
    totals(dayAgo),
    totals(weekAgo),
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
    lastFailure: lastFailure ? toJson(lastFailure) : null,
  };
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
