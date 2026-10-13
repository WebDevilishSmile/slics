import { ObjectId } from 'mongodb';

import { ACTIVITY_KINDS } from '@/constants';
import client from '@/lib/db/client';
import { auditText } from '@/lib/db/admins';
import { htmlToText } from '@/lib/commentText';
import { formatWeekEnding } from '@/lib/onCallSheet';
import { formatAmount, supportTitle } from '@/lib/pushEvents';

// The super admin's activity feed (/admin/super/activity and the hub's latest
// rows, docs/SUPER-ADMIN-HUB.md stage D): one newest-first stream merged from
// the collections that record something happening. Read-only, super admin
// only, so it names drivers the way the admin pages do. Tip and comment text
// is a plain-text snippet, rendered as text, never HTML (SECURITY.md #2).
//
// Each source reads up to `limit + slack` rows at or before the cursor; the
// rows are merged, sorted by (at, id) newest first, and cut to `limit`. The
// cursor is the last row shown, `<at ISO>|<id>`, so rows sharing a time aren't
// lost or repeated across pages.
//
// Times come in three forms (DATA-MODEL.md): `_id` time (users, comments,
// which have mixed `created_at`s), ISO strings and Dates. Each source says
// which. ISO-string sources only read ISO rows, so an old `MM/DD/YY` string
// can't sort among them.

export const ACTIVITY_PAGE_SIZE = 30;
const SLACK = 10;
const SNIPPET = 80;
const KIND_KEYS = new Set(ACTIVITY_KINDS.map((kind) => kind.key));
const ISO_ROW = /^\d{4}-\d{2}-\d{2}T/;

const snippet = (comment) => {
  const text = (comment.format === 'text' ? comment.content : htmlToText(comment.content)) || '';
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > SNIPPET ? `${flat.slice(0, SNIPPET - 1)}…` : flat;
};
const firstName = (name) => (name ? String(name).split(' ')[0] : 'A driver');
const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

// The cursor's bound for each kind of time field.
function bound(type, field, before) {
  if (!before) return {};
  if (type === 'objectId') {
    // Every id in the cursor's second or earlier.
    const seconds = Math.floor(before.at.getTime() / 1000) + 1;
    return { [field]: { $lt: ObjectId.createFromTime(seconds) } };
  }
  if (type === 'iso') return { [field]: { $lte: before.at.toISOString() } };
  return { [field]: { $lte: before.at } };
}

const timeOf = (type, value) => {
  if (type === 'objectId') return value.getTimestamp();
  return value instanceof Date ? value : new Date(value);
};

// Account names for string or ObjectId user ids, as a Map of id string → name.
async function namesFor(db, ids) {
  const unique = [...new Set(ids.filter((id) => id && ObjectId.isValid(String(id))).map(String))];
  if (unique.length === 0) return new Map();
  const users = await db
    .collection('users')
    .find({ _id: { $in: unique.map((id) => new ObjectId(id)) } }, { projection: { name: 1 } })
    .toArray();
  return new Map(users.map((user) => [String(user._id), user.name ?? null]));
}

// Each source → rows of { id, kind, at: Date, text, href }.
const SOURCES = {
  async signUps(db, before, n) {
    const users = await db
      .collection('users')
      .find(bound('objectId', '_id', before), { projection: { name: 1 } })
      .sort({ _id: -1 })
      .limit(n)
      .toArray();
    return users.map((user) => ({
      id: `user-${user._id}`,
      at: user._id.getTimestamp(),
      text: `${user.name || 'Someone'} signed up`,
      href: `/admin/users/${user._id}`,
    }));
  },

  async tips(db, before, n) {
    const comments = await db
      .collection('comments')
      .find(
        { ...bound('objectId', '_id', before), deleted: { $ne: true } },
        { projection: { numSlic: 1, userId: 1, parentId: 1, content: 1, format: 1 } },
      )
      .sort({ _id: -1 })
      .limit(n)
      .toArray();
    const names = await namesFor(db, comments.map((comment) => comment.userId));
    return comments.map((comment) => {
      const text = snippet(comment);
      return {
        id: `tip-${comment._id}`,
        at: comment._id.getTimestamp(),
        text: `${firstName(names.get(String(comment.userId)))} ${comment.parentId ? 'replied' : 'posted a tip'} on SLIC ${comment.numSlic}${text ? `: "${text}"` : ' (a pin)'}`,
        href: `/home?slic=${encodeURIComponent(comment.numSlic)}`,
      };
    });
  },

  async reports(db, before, n) {
    const reports = await db
      .collection('slic-reports')
      .find(
        { created_at: { ...bound('iso', 'created_at', before).created_at, $regex: ISO_ROW } },
        { projection: { numSlic: 1, kind: 1, created_at: 1, userId: 1 } },
      )
      .sort({ created_at: -1 })
      .limit(n)
      .toArray();
    const names = await namesFor(db, reports.map((report) => report.userId));
    return reports.map((report) => ({
      id: `report-${report._id}`,
      at: timeOf('iso', report.created_at),
      text: `${firstName(names.get(String(report.userId)))} reported SLIC ${report.numSlic} (${report.kind})`,
      href: '/admin/reports',
    }));
  },

  async claims(db, before, n) {
    const claims = db.collection('driver-claims');
    const projection = { userId: 1, name: 1, status: 1, created_at: 1, decided_at: 1, decidedBy: 1, linkedName: 1 };
    // "This is a mistake" on /covers (lib/db/coverDisputes.js) files here too.
    const [filed, decided, disputes] = await Promise.all([
      claims
        .find({ created_at: { ...bound('iso', 'created_at', before).created_at, $regex: ISO_ROW } }, { projection })
        .sort({ created_at: -1 })
        .limit(n)
        .toArray(),
      claims
        .find({ decided_at: { ...bound('iso', 'decided_at', before).decided_at, $regex: ISO_ROW } }, { projection })
        .sort({ decided_at: -1 })
        .limit(n)
        .toArray(),
      db
        .collection('cover-disputes')
        .find(
          { created_at: { ...bound('iso', 'created_at', before).created_at, $regex: ISO_ROW } },
          { projection: { driverName: 1, created_at: 1 } },
        )
        .sort({ created_at: -1 })
        .limit(n)
        .toArray(),
    ]);
    return [
      ...disputes.map((dispute) => ({
        id: `dispute-${dispute._id}`,
        at: timeOf('iso', dispute.created_at),
        text: `${dispute.driverName || 'A driver'} said they should be on the cover list`,
        href: '/admin/driver-claims',
      })),
      ...filed.map((claim) => ({
        id: `claim-${claim._id}`,
        at: timeOf('iso', claim.created_at),
        text: `${claim.name || 'A driver'} asked to be verified for Covers`,
        href: '/admin/driver-claims',
      })),
      ...decided.map((claim) => ({
        id: `claim-decided-${claim._id}`,
        at: timeOf('iso', claim.decided_at),
        text:
          claim.status === 'approved'
            ? `${claim.decidedBy?.name || 'An admin'} verified ${claim.name || 'a driver'}${claim.linkedName ? ` as ${claim.linkedName}` : ''}`
            : `${claim.decidedBy?.name || 'An admin'} turned down ${claim.name || 'a driver'}'s claim`,
        href: '/admin/driver-claims',
      })),
    ];
  },

  async slics(db, before, n) {
    const rows = await db
      .collection('slic_history')
      .find(bound('date', 'timestamp', before), {
        projection: { numSlic: 1, action: 1, changes: 1, user: 1, timestamp: 1 },
      })
      .sort({ timestamp: -1 })
      .limit(n)
      .toArray();
    return rows.map((row) => ({
      id: `slic-${row._id}`,
      at: timeOf('date', row.timestamp),
      text:
        row.action === 'created'
          ? `${row.user?.name || 'An admin'} added SLIC ${row.numSlic}`
          : `${row.user?.name || 'An admin'} edited SLIC ${row.numSlic}${row.changes?.length ? ` (${row.changes.map((change) => change.field).join(', ')})` : ''}`,
      href: `/home?slic=${encodeURIComponent(row.numSlic)}`,
    }));
  },

  async jobs(db, before, n) {
    // One row per read of the Jobs tab that changed something.
    const groups = await db
      .collection('sheet-job-changes')
      .aggregate([
        { $match: { seenAt: { ...bound('iso', 'seenAt', before).seenAt, $regex: ISO_ROW } } },
        { $sort: { seenAt: -1 } },
        { $group: { _id: '$seenAt', count: { $sum: 1 }, source: { $first: '$source' } } },
        { $sort: { _id: -1 } },
        { $limit: n },
      ])
      .toArray();
    return groups.map((group) => ({
      id: `jobs-${group._id}`,
      at: timeOf('iso', group._id),
      text: `${plural(group.count, 'change')} on the Jobs tab${group.source ? ` (${group.source})` : ''}`,
      href: '/admin/jobs',
    }));
  },

  async picks(db, before, n) {
    const groups = await db
      .collection('cover-bid-pick-events')
      .aggregate([
        { $match: { seenAt: { ...bound('iso', 'seenAt', before).seenAt, $regex: ISO_ROW } } },
        { $sort: { seenAt: -1 } },
        {
          $group: {
            _id: { seenAt: '$seenAt', weekEnding: '$weekEnding' },
            count: { $sum: 1 },
            names: { $addToSet: '$name' },
          },
        },
        { $sort: { '_id.seenAt': -1 } },
        { $limit: n },
      ])
      .toArray();
    return groups.map((group) => ({
      id: `picks-${group._id.weekEnding}-${group._id.seenAt}`,
      at: timeOf('iso', group._id.seenAt),
      text: `Picks changed for ${plural(group.names.length, 'driver')}, W/E ${formatWeekEnding(group._id.weekEnding)}`,
      href: `/admin/cover/jobs?week=${group._id.weekEnding}`,
    }));
  },

  async places(db, before, n) {
    const projection = { name: 1, createdBy: 1, created_at: 1, userId: 1, placeId: 1, parentId: 1, content: 1, format: 1 };
    const [places, comments] = await Promise.all([
      db
        .collection('places')
        .find({ created_at: { ...bound('iso', 'created_at', before).created_at, $regex: ISO_ROW } }, { projection })
        .sort({ created_at: -1 })
        .limit(n)
        .toArray(),
      db
        .collection('placeComments')
        .find(
          { created_at: { ...bound('iso', 'created_at', before).created_at, $regex: ISO_ROW }, deleted: { $ne: true } },
          { projection },
        )
        .sort({ created_at: -1 })
        .limit(n)
        .toArray(),
    ]);
    const names = await namesFor(db, [
      ...places.map((place) => place.createdBy),
      ...comments.map((comment) => comment.userId),
    ]);
    const placeNames = new Map(
      (
        await db
          .collection('places')
          .find({ _id: { $in: comments.map((comment) => comment.placeId) } }, { projection: { name: 1 } })
          .toArray()
      ).map((place) => [String(place._id), place.name]),
    );
    return [
      ...places.map((place) => ({
        id: `place-${place._id}`,
        at: timeOf('iso', place.created_at),
        text: `${firstName(names.get(String(place.createdBy)))} added a place: ${place.name}`,
        href: '/places',
      })),
      ...comments.map((comment) => {
        const text = snippet({ ...comment, format: 'text' });
        return {
          id: `place-comment-${comment._id}`,
          at: timeOf('iso', comment.created_at),
          text: `${firstName(names.get(String(comment.userId)))} ${comment.parentId ? 'replied' : 'commented'} on ${placeNames.get(String(comment.placeId)) || 'a place'}${text ? `: "${text}"` : ''}`,
          href: '/places',
        };
      }),
    ];
  },

  async support(db, before, n) {
    const events = await db
      .collection('bmc-events')
      .find(bound('date', 'receivedAt', before), {
        projection: { type: 1, amount: 1, currency: 1, supporterName: 1, receivedAt: 1, source: 1 },
      })
      .sort({ receivedAt: -1 })
      .limit(n)
      .toArray();
    return events.map((event) => {
      const amount = formatAmount(event.amount, event.currency);
      return {
        id: `support-${event._id}`,
        at: timeOf('date', event.receivedAt),
        text: `${supportTitle(event.type)}${amount ? ` · ${amount}` : ''}${event.supporterName ? ` from ${event.supporterName}` : ''}${event.source === 'import' ? ' (imported)' : ''}`,
        href: '/admin/super/supporters',
      };
    });
  },

  async admin(db, before, n) {
    const rows = await db
      .collection('admin_audit')
      .find(bound('date', 'at', before))
      .sort({ at: -1 })
      .limit(n)
      .toArray();
    return rows.map((row) => ({
      id: `audit-${row._id}`,
      at: timeOf('date', row.at),
      text: `${row.actorName || 'A script'}: ${auditText(row)}`,
      href: row.targetType === 'user' && row.targetId ? `/admin/users/${row.targetId}` : null,
    }));
  },

  async push(db, before, n) {
    const rows = await db
      .collection('push-log')
      .find(bound('date', 'at', before))
      .sort({ at: -1 })
      .limit(n)
      .toArray();
    const how = { test: 'Test', sample: 'Sample', compose: 'Written notification' };
    // Gone devices aren't failures (lib/db/pushLog.js).
    const errored = (row) => Math.max(0, (row.failed ?? 0) - (row.gone ?? 0));
    return rows.map((row) => ({
      id: `push-${row._id}`,
      at: timeOf('date', row.at),
      text: `${how[row.source] ?? 'Notification'} "${row.title}" to ${plural(row.devices ?? 0, 'device')}${errored(row) ? ` (${errored(row)} failed)` : ''}`,
      href: '/admin/super/notifications',
    }));
  },
};

// `before`: the cursor of the last row shown, or null. `kinds`: the source
// keys to read, or every one. → { rows: [{ id, kind, at (ISO), text, href }],
// next: cursor | null }
export async function getActivity({ before = null, kinds = null, limit = ACTIVITY_PAGE_SIZE } = {}) {
  const cursor = parseCursor(before);
  if (before && !cursor) return { rows: [], next: null };
  const keys = (kinds?.length ? kinds : [...KIND_KEYS]).filter((key) => KIND_KEYS.has(key));

  const db = client.db();
  const results = await Promise.all(
    keys.map(async (key) => {
      try {
        const rows = await SOURCES[key](db, cursor, limit + SLACK);
        return rows.map((row) => ({ ...row, kind: key }));
      } catch (error) {
        // One source failing leaves the rest of the feed.
        console.error(`Error reading ${key} activity:`, error);
        return [];
      }
    }),
  );

  const rows = results
    .flat()
    .filter((row) => !Number.isNaN(row.at.getTime()))
    .filter((row) => !cursor || isBefore(row, cursor))
    .sort((a, b) => b.at - a.at || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    rows: page.map((row) => ({ ...row, at: row.at.toISOString() })),
    next: rows.length > limit && last ? `${last.at.toISOString()}|${last.id}` : null,
  };
}

// Strictly after the cursor in feed order (older, or as old with a smaller id).
const isBefore = (row, cursor) =>
  row.at < cursor.at || (row.at.getTime() === cursor.at.getTime() && row.id < cursor.id);

function parseCursor(value) {
  if (typeof value !== 'string' || !value.includes('|')) return null;
  const [at, ...rest] = value.split('|');
  const date = new Date(at);
  const id = rest.join('|');
  return Number.isNaN(date.getTime()) || !id ? null : { at: date, id };
}
