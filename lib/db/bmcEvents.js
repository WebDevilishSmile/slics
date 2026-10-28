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

// BMC's `live_mode`: false on a test sent from its webhook settings (seen
// 2026-10-13). → true, false, or null when the payload doesn't say.
const toLiveMode = (value) => {
  if (value === true || value === 'true' || value === 1) return true;
  if (value === false || value === 'false' || value === 0) return false;
  return null;
};

// Money totals leave out BMC's test deliveries. Rows saved before `liveMode`
// was (2026-10-13) don't have it and count.
const NOT_TEST = { liveMode: { $ne: false } };

// What a `.updated` delivery (a membership or monthly support) was, from the
// status and period BMC sends with it (docs/BMC-SUPPORT.md, "Renewals"). Seen
// 2026-10-14: a monthly membership's new period began at 17:04 UTC and a
// membership.updated came at 17:05, the renewal; another at 18:05 left it
// past_due, its charge failed. `update` is:
//   'renewed'        a new period began within a day before it came
//   'paymentFailed'  the subscription is behind on payment
//   'paid'           a renewal whose charge had failed went through after all
//   'other'          anything else (a plan change, a second update in a period)
// Rows saved before 2026-10-14 have no `update`.
const PAYMENT_FAILED = new Set(['past_due', 'unpaid', 'incomplete', 'incomplete_expired']);
const RENEWAL_WINDOW_MS = 24 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const isUpdate = (type) => typeof type === 'string' && type.endsWith('.updated');

// Money in: a `.updated` row only as a renewal whose charge hasn't failed,
// every other type as before.
const PAID = { $or: [{ type: { $not: /\.updated$/ } }, { update: 'renewed', unpaid: { $ne: true } }] };

// BMC's period times: Unix seconds (its API), or a date string.
const toDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  const date = Number.isFinite(number) ? new Date(number < 1e12 ? number * 1000 : number) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

function updateKind(status, periodStart, now) {
  if (PAYMENT_FAILED.has(status)) return 'paymentFailed';
  const age = periodStart ? now - periodStart : NaN;
  return age >= -CLOCK_SKEW_MS && age <= RENEWAL_WINDOW_MS ? 'renewed' : 'other';
}

// → the row's fields from a parsed webhook body. `key` is a hash of the exact
// body: a retried delivery and a captured-and-replayed one have the same key,
// and the unique index on it turns both into no-ops. `now` is when it came.
export function parseBmcEvent(rawBody, event, now = new Date()) {
  const data = event?.data ?? event?.response ?? {};
  const type = typeof event?.type === 'string' ? event.type : 'unknown';
  // A subscription's state (memberships and monthly support), kept since
  // 2026-10-14 to tell a renewal from a failed charge: no personal details.
  const status = typeof data.status === 'string' && data.status ? data.status.slice(0, 40) : null;
  const periodStart = toDate(data.current_period_start);
  const subscription = status
    ? { status, periodStart, subscriptionId: data.id === undefined || data.id === null ? null : String(data.id) }
    : {};
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
    type,
    liveMode: toLiveMode(event?.live_mode),
    ...subscription,
    ...(isUpdate(type) ? { update: updateKind(status, periodStart, now) } : {}),
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
// may differ in case): `{ userId, confirmed }`, or `{ userId: null }`.
// `confirmed` is whether the account has shown it owns the address: a
// password account used its emailed link, or the account signs in with Google
// (whose rows Auth.js leaves at `emailVerified: null`, so the `accounts` row
// says it). Only a confirmed account gets a membership (docs/SECURITY.md #8
// step 4): an address anyone typed at sign-up could be someone else's.
export async function findMemberAccount(email) {
  if (!email) return { userId: null, confirmed: false };
  const db = client.db();
  const user = await db
    .collection('users')
    .findOne({ email }, { projection: { _id: 1, emailVerified: 1 }, collation: { locale: 'en', strength: 2 } });
  if (!user) return { userId: null, confirmed: false };
  const confirmed =
    Boolean(user.emailVerified) ||
    Boolean(await db.collection('accounts').findOne({ userId: user._id, provider: 'google' }, { projection: { _id: 1 } }));
  return { userId: user._id, confirmed };
}

// BMC's membership events that turn `bmcMember` on or off (the webhook's).
export const MEMBERSHIP_EVENTS = {
  'membership.started': true,
  'membership.cancelled': false,
  'membership.canceled': false,
};

// A membership that waited for the account's email to be confirmed: once it
// is (a used link, lib/db/emailConfirmations.js, or a Google sign-in,
// lib/db/accountLinking.js), the newest live membership event for the address
// says whether it's on. Never throws; nothing happens without an event.
// → the new `bmcMember`, or null when there was nothing to apply.
export async function applyMembershipFromEvents(userId, email) {
  try {
    const address = normalizeEmail(email);
    if (!address) return null;
    const latest = await client
      .db()
      .collection(COLLECTION)
      .findOne(
        { email: address, type: { $in: Object.keys(MEMBERSHIP_EVENTS) }, ...NOT_TEST },
        { sort: { receivedAt: -1 }, projection: { type: 1 } },
      );
    if (!latest) return null;
    const member = MEMBERSHIP_EVENTS[latest.type];
    await setBmcMember(new ObjectId(userId), member);
    console.log(`BMC: user ${userId} bmcMember → ${member} once their email was confirmed.`);
    return member;
  } catch (error) {
    console.error('BMC: applying a waiting membership failed:', error?.name, error?.code ?? '');
    return null;
  }
}

// Saves the event unless its key was seen before. → { duplicate, event }.
//
// One renewal per subscription period: a later update in the same period is
// the charge failing ('paymentFailed', which marks the renewal `unpaid` so the
// totals drop it), a failed charge going through ('paid', which clears it), or
// something else ('other').
export async function recordBmcEvent(fields) {
  const collection = client.db().collection(COLLECTION);
  const existing = await collection.findOne({ key: fields.key }, { projection: { _id: 1 } });
  if (existing) return { duplicate: true, event: null };

  let row = fields;
  let renewal = null;
  if (fields.update && fields.subscriptionId && fields.periodStart) {
    renewal = await collection.findOne(
      { subscriptionId: fields.subscriptionId, periodStart: fields.periodStart, update: 'renewed' },
      { projection: { unpaid: 1 } },
    );
    if (renewal && fields.update !== 'paymentFailed') {
      row = { ...fields, update: renewal.unpaid ? 'paid' : 'other' };
    }
  }

  const event = { ...row, receivedAt: new Date() };
  let insertedId;
  try {
    ({ insertedId } = await collection.insertOne(event));
  } catch (error) {
    // Two deliveries racing past the findOne: the unique index (scripts/
    // createIndexes.js) rejects the second.
    if (error?.code === 11000) return { duplicate: true, event: null };
    throw error;
  }
  if (renewal && row.update === 'paymentFailed') {
    await collection.updateOne({ _id: renewal._id }, { $set: { unpaid: true } });
  } else if (renewal && row.update === 'paid') {
    await collection.updateOne({ _id: renewal._id }, { $unset: { unpaid: '' } });
  }
  return { duplicate: false, event: { ...event, _id: insertedId } };
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
      update: event.update ?? null,
      test: event.liveMode === false,
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
        { $match: { amount: { $type: 'number' }, ...NOT_TEST, ...PAID } },
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
// cancellation or an update. A renewal isn't thanked again (the note's words
// are for a start or a coffee), nor is a failed charge. → the newest such
// event's type and when it came in (ISO, the date on the note), or null.
const NOT_THANKED = (userId) => ({
  userId,
  thankedAt: { $exists: false },
  type: {
    $nin: ['membership.cancelled', 'membership.canceled', 'recurring_donation.cancelled'],
    $not: /\.updated$/,
  },
});

export async function getUnthankedSupport(userId) {
  const event = await client
    .db()
    .collection(COLLECTION)
    .findOne(NOT_THANKED(userId), { sort: { receivedAt: -1 }, projection: { type: 1, receivedAt: 1 } });
  return event ? { type: event.type, receivedAt: iso(event.receivedAt) } : null;
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

// "Delete" on the Supporters page's Recent list (docs/BMC-SUPPORT.md stage 2),
// for BMC's test deliveries. The row is gone for good, `key` included, so the
// same body sent again would be saved again. Membership it turned on stays on.
// → the row's summary for `admin_audit`, or null when there's no such event.
export async function getBmcEventSummary(id) {
  if (!ObjectId.isValid(id)) return null;
  const event = await client
    .db()
    .collection(COLLECTION)
    .findOne(
      { _id: new ObjectId(id) },
      { projection: { type: 1, amount: 1, currency: 1, receivedAt: 1, liveMode: 1, source: 1 } },
    );
  if (!event) return null;
  return {
    _id: event._id,
    text: [
      event.type,
      event.amount !== null && event.amount !== undefined ? `${event.amount} ${event.currency ?? ''}`.trim() : null,
      iso(event.receivedAt),
      event.liveMode === false ? 'test' : null,
      event.source === 'import' ? 'imported' : null,
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

// → true when a row was deleted.
export async function deleteBmcEvent(id) {
  const { deletedCount } = await client.db().collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return deletedCount === 1;
}

// The Supporters card on the super admin hub (docs/SUPER-ADMIN-HUB.md): what
// came in over the last 30 days, per currency, and the support count.
// Cancellations, refunds and updates other than a paid renewal aren't money in.
// → { totals: [{ currency, total }], count }
export async function getSupportSummary() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await client
    .db()
    .collection(COLLECTION)
    .aggregate([
      {
        $match: {
          receivedAt: { $gte: since },
          amount: { $type: 'number' },
          ...NOT_TEST,
          ...PAID,
          type: { $not: /cancel|refund/ },
        },
      },
      { $group: { _id: '$currency', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])
    .toArray();
  return {
    totals: rows.map((row) => ({ currency: row._id ?? null, total: row.total })),
    count: rows.reduce((sum, row) => sum + row.count, 0),
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
