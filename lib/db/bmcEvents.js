import crypto from 'crypto';
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
  const coffees = toNumber(first(data, ['support_coffees', 'coffees', 'quantity']));
  const price = toNumber(first(data, ['support_coffee_price', 'coffee_price', 'unit_price']));
  const amount =
    toNumber(first(data, ['amount', 'total_amount', 'support_amount', 'total'])) ??
    (coffees && price ? coffees * price : null);

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
