import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import client from '@/lib/db/client';

// Every Buy Me a Coffee webhook delivery, one row each (`bmc-events`,
// docs/BMC-SUPPORT.md). Memberships and one-time support alike; the admin
// Supporters page and the thank-you notice read from here.
//
// BMC's payload isn't documented in public. The membership shape the old
// handler was fixed against is `{ type, data: { supporter_email } }`; a blog
// post shows `{ response: { … } }`. So fields are read from either, under the
// names seen in the wild, and each row keeps the payload's field *names*
// (never values) so the first real one-time coffee shows what BMC sends.
// BMC's own API (the buymeacoffee MCP tools, 2026-10-10) names a coffee's
// fields `supporter_email`, `support_note`, `coffee_count`, `amount` (the price
// of one coffee) and `total_amount` (what was paid); the webhook is assumed to
// match until a real delivery shows otherwise.

const COLLECTION = 'bmc-events';

const first = (object, names) => {
  for (const name of names) {
    const value = object?.[name];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
};

const toNumber = (value) => {
  const number = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(number) ? number : null;
};

export const normalizeEmail = (email) =>
  typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;

// → the row's fields from a parsed webhook body. `key` is a hash of the exact
// body: a retried delivery and a captured-and-replayed one have the same key,
// and the unique index on it turns both into no-ops.
export function parseBmcEvent(rawBody, event) {
  const data = event?.data ?? event?.response ?? {};
  const coffees = toNumber(first(data, ['coffee_count', 'support_coffees', 'coffees', 'quantity']));
  const price = toNumber(first(data, ['support_coffee_price', 'coffee_price', 'unit_price', 'amount']));
  // The total first: on a coffee, `amount` is one coffee's price, so a
  // five-coffee support would read as one. On a membership it's the price paid.
  const amount =
    toNumber(first(data, ['total_amount', 'support_amount', 'total'])) ??
    (coffees && price ? coffees * price : null) ??
    toNumber(data.amount);

  return {
    key: crypto.createHash('sha256').update(rawBody).digest('hex'),
    externalId: first(event, ['id', 'event_id']) ?? first(data, ['id', 'support_id', 'membership_id']),
    type: typeof event?.type === 'string' ? event.type : 'unknown',
    email: normalizeEmail(first(data, ['supporter_email', 'support_email', 'payer_email', 'email'])),
    supporterName: first(data, ['supporter_name', 'payer_name', 'name']),
    amount,
    currency: first(data, ['currency', 'currency_code']),
    message: first(data, ['support_note', 'supporter_message', 'message', 'note']),
    fields: {
      top: Object.keys(event ?? {}).sort(),
      data: Object.keys(data).sort(),
    },
  };
}

// The account with this email, case-insensitively (BMC's email and the app's
// may differ in case), or null.
export async function findUserIdByEmail(email) {
  if (!email) return null;
  const user = await client
    .db()
    .collection('users')
    .findOne({ email }, { projection: { _id: 1 }, collation: { locale: 'en', strength: 2 } });
  return user?._id ?? null;
}

// Saves the event unless its key was seen before. → { duplicate, event }.
export async function recordBmcEvent(fields) {
  const collection = client.db().collection(COLLECTION);
  const existing = await collection.findOne({ key: fields.key }, { projection: { _id: 1 } });
  if (existing) return { duplicate: true, event: null };

  const event = { ...fields, receivedAt: new Date() };
  try {
    const { insertedId } = await collection.insertOne(event);
    return { duplicate: false, event: { ...event, _id: insertedId } };
  } catch (error) {
    // Two deliveries racing past the findOne: the unique index (scripts/
    // createIndexes.js) rejects the second.
    if (error?.code === 11000) return { duplicate: true, event: null };
    throw error;
  }
}

// Membership on or off for the matched account, keyed by _id (not email).
// → the previous value, or null when nothing changed.
export async function setBmcMember(userId, member) {
  const before = await client
    .db()
    .collection('users')
    .findOneAndUpdate({ _id: userId }, { $set: { bmcMember: member } }, { projection: { bmcMember: 1 } });
  return before ? !!before.bmcMember : null;
}

const iso = (date) => (date instanceof Date ? date.toISOString() : date ?? null);

// Everything the admin Supporters page shows (docs/BMC-SUPPORT.md stage 2),
// as plain JSON. Super admin only: it carries emails, amounts and messages.
// The Recent list on the Supporters page, newest first, a page at a time:
// `before` is the last event id already shown. → { events, hasMore }.
export const RECENT_PAGE_SIZE = 10;

export async function getRecentSupport({ before = null, limit = RECENT_PAGE_SIZE } = {}) {
  const db = client.db();
  const events = db.collection(COLLECTION);

  let filter = {};
  if (before) {
    const anchor = ObjectId.isValid(before)
      ? await events.findOne({ _id: new ObjectId(before) }, { projection: { receivedAt: 1 } })
      : null;
    if (!anchor) return { events: [], hasMore: false };
    filter = {
      $or: [
        { receivedAt: { $lt: anchor.receivedAt } },
        { receivedAt: anchor.receivedAt, _id: { $lt: anchor._id } },
      ],
    };
  }

  const rows = await events
    .find(filter, { projection: { key: 0, fields: 0 } })
    .sort({ receivedAt: -1, _id: -1 })
    .limit(limit + 1)
    .toArray();
  const page = rows.slice(0, limit);

  const userIds = [...new Set(page.map((event) => event.userId).filter(Boolean).map(String))];
  const users = userIds.length
    ? await db
        .collection('users')
        .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }, { projection: { name: 1 } })
        .toArray()
    : [];
  const names = new Map(users.map((user) => [String(user._id), user.name]));

  return {
    hasMore: rows.length > limit,
    events: page.map((event) => ({
      _id: String(event._id),
      type: event.type,
      email: event.email,
      supporterName: event.supporterName ?? null,
      amount: event.amount ?? null,
      currency: event.currency ?? null,
      message: event.message ?? null,
      userId: event.userId ? String(event.userId) : null,
      userName: event.userId ? (names.get(String(event.userId)) ?? null) : null,
      receivedAt: iso(event.receivedAt),
    })),
  };
}

export async function getSupportOverview() {
  const db = client.db();
  const events = db.collection(COLLECTION);

  const [months, recent, unmatched, members] = await Promise.all([
    // Totals per month and currency, newest first, two years back at most.
    events
      .aggregate([
        { $match: { amount: { $type: 'number' } } },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: '%Y-%m', date: '$receivedAt' } },
              currency: '$currency',
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.month': -1 } },
        { $limit: 48 },
      ])
      .toArray(),
    getRecentSupport(),
    // Support from emails with no account, one row per email.
    events
      .aggregate([
        { $match: { userId: null, email: { $ne: null } } },
        {
          $group: {
            _id: '$email',
            name: { $last: '$supporterName' },
            count: { $sum: 1 },
            lastAt: { $max: '$receivedAt' },
            types: { $addToSet: '$type' },
          },
        },
        { $sort: { lastAt: -1 } },
      ])
      .toArray(),
    // Members as the app sees them, including ones toggled by hand.
    db
      .collection('users')
      .find({ bmcMember: true }, { projection: { name: 1, email: 1 } })
      .sort({ name: 1 })
      .toArray(),
  ]);

  return {
    months: months.map(({ _id, total, count }) => ({
      month: _id.month,
      currency: _id.currency ?? null,
      total,
      count,
    })),
    recent: recent.events,
    recentHasMore: recent.hasMore,
    unmatched: unmatched.map(({ _id, name, count, lastAt, types }) => ({
      email: _id,
      name: name ?? null,
      count,
      lastAt: iso(lastAt),
      types: types.sort(),
    })),
    members: members.map((user) => ({ _id: String(user._id), name: user.name ?? '', email: user.email ?? '' })),
  };
}

// The thank-you notice (docs/BMC-SUPPORT.md stage 3). Support that hasn't been
// thanked yet: memberships started and anything else that isn't a
// cancellation. → the newest such event's type, or null.
const NOT_THANKED = (userId) => ({
  userId,
  thankedAt: { $exists: false },
  type: { $nin: ['membership.cancelled', 'membership.canceled', 'recurring_donation.cancelled'] },
});

export async function getUnthankedSupport(userId) {
  const event = await client
    .db()
    .collection(COLLECTION)
    .findOne(NOT_THANKED(userId), { sort: { receivedAt: -1 }, projection: { type: 1 } });
  return event ? { type: event.type } : null;
}

// Dismissing the notice thanks every waiting event at once, so it shows once
// per visit's worth of support, not once per event.
export async function markSupportThanked(userId) {
  const { modifiedCount } = await client
    .db()
    .collection(COLLECTION)
    .updateMany(NOT_THANKED(userId), { $set: { thankedAt: new Date() } });
  return modifiedCount;
}

// "Link to account" on the Supporters page (docs/BMC-SUPPORT.md stage 2): the
// support from an email that matched no account (a different address on BMC,
// or capitals the old webhook missed) is attached to `userId`. →
// { linked, membershipStarted }: how many events moved, and whether that
// email's latest membership event is a start (the caller then turns
// membership on). Webhook events not yet thanked will show the driver the
// thank-you note; imported ones were stamped thanked.
const MEMBERSHIP_TYPES = ['membership.started', 'membership.cancelled', 'membership.canceled'];

export async function linkSupportToUser(email, userId) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { linked: 0, membershipStarted: false };
  const events = client.db().collection(COLLECTION);

  const { modifiedCount } = await events.updateMany(
    { email: normalized, userId: null },
    { $set: { userId, linkedAt: new Date() } },
  );
  const latestMembership = await events.findOne(
    { email: normalized, type: { $in: MEMBERSHIP_TYPES } },
    { sort: { receivedAt: -1 }, projection: { type: 1 } },
  );
  return {
    linked: modifiedCount,
    membershipStarted: latestMembership?.type === 'membership.started',
  };
}

// When a driver first supported the app: their oldest support that isn't a
// cancellation, as an ISO string, or null. For "Supporter since …" on their
// own profile and on the admin's user page.
export async function getSupporterSince(userId) {
  const event = await client
    .db()
    .collection(COLLECTION)
    .findOne(
      {
        userId,
        type: { $nin: ['membership.cancelled', 'membership.canceled', 'recurring_donation.cancelled'] },
      },
      { sort: { receivedAt: 1 }, projection: { receivedAt: 1 } },
    );
  return event ? iso(event.receivedAt) : null;
}
