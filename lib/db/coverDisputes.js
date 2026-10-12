import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { COVER_DISPUTE_NOTE_MAX_LENGTH } from '@/constants';

// "This is a mistake" on /covers (docs/COVER-BIDDING.md): a verified driver
// the week's pick list doesn't name (lib/coverDrivers.js offListWeeks) sees
// Covers read only, and can tell the admins they should be on it.
//
// `cover-disputes`, one document per message:
//   { userId: ObjectId, driverName, weeks: ['YYYY-MM-DD'], note,
//     status: 'open' | 'closed', reply?, created_at, updated_at?,
//     closed_at?, closedBy?: { id, name } }
// - `driverName` is the sheet name the account was linked to when it was sent,
//   and `weeks` the posted weeks it was off; both are what the admin checks.
// - `note` is the driver's, `reply` the admin's answer on closing, which the
//   driver sees on /covers. Both plain text, never HTML.
// - A driver has at most one open dispute (a unique index); sending again
//   edits it. Once it's closed they can send another.
// Timestamps are ISO strings. Disputes are deleted with the account.

const disputes = () => client.db().collection('cover-disputes');
const users = () => client.db().collection('users');

const CLOSED_SHOWN = 20;

const now = () => new Date().toISOString();
const stamp = (actor) => ({ id: actor?.id ?? null, name: actor?.name ?? null });
const cleanNote = (value) =>
  typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '';

// A note from a request body → `{ note }` or `{ error }` for a 400.
export function validateDisputeNote(value) {
  if (value != null && typeof value !== 'string') return { error: 'Invalid note.' };
  const note = cleanNote(value);
  if (note.length > COVER_DISPUTE_NOTE_MAX_LENGTH) {
    return { error: `Keep the note to ${COVER_DISPUTE_NOTE_MAX_LENGTH} characters.` };
  }
  return { note };
}

// A dispute as its own driver sees it on /covers: when they sent it, and once
// it's closed, the admin's answer.
function ownDispute(doc) {
  if (!doc) return null;
  return {
    _id: doc._id.toString(),
    status: doc.status,
    sent_at: doc.updated_at ?? doc.created_at,
    closed_at: doc.closed_at ?? null,
    reply: doc.status === 'closed' ? doc.reply || '' : '',
  };
}

// Sends a dispute, or edits the driver's open one. → { dispute } (ownDispute),
// and `created` when it's new rather than an edit.
export async function createCoverDispute({ userId, driverName, weeks, note }) {
  const owner = new ObjectId(userId);
  const edit = () =>
    disputes().findOneAndUpdate(
      { userId: owner, status: 'open' },
      { $set: { driverName, weeks, note, updated_at: now() } },
      { returnDocument: 'after' },
    );

  let doc = await edit();
  let created = false;
  if (!doc) {
    const fresh = { userId: owner, driverName, weeks, note, status: 'open', created_at: now() };
    try {
      await disputes().insertOne(fresh);
      doc = fresh;
      created = true;
    } catch (error) {
      // Two sends at once: the unique index let only one of them in.
      if (error?.code !== 11000) throw error;
      doc = await edit();
    }
  }
  return { dispute: ownDispute(doc), created };
}

// The driver's latest dispute (ownDispute), or null if they've never sent one.
export async function getMyCoverDispute(userId) {
  if (!userId || !ObjectId.isValid(userId)) return null;
  const doc = await disputes()
    .find({ userId: new ObjectId(userId) })
    .sort({ created_at: -1 })
    .limit(1)
    .next();
  return ownDispute(doc);
}

// Disputes as the admin page shows them, with the account behind each and the
// name it's linked to now (an admin may have re-linked it since).
async function shapeForAdmin(docs) {
  const ids = [...new Set(docs.map((doc) => doc.userId?.toString()).filter(Boolean))];
  const accounts = ids.length
    ? await users()
        .find(
          { _id: { $in: ids.map((id) => new ObjectId(id)) } },
          { projection: { name: 1, email: 1, driver: 1 } },
        )
        .toArray()
    : [];
  const byId = new Map(
    accounts.map((user) => [
      user._id.toString(),
      {
        _id: user._id.toString(),
        name: user.name ?? '',
        email: user.email ?? '',
        driverName: user.driver?.name ?? null,
      },
    ]),
  );
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    status: doc.status,
    driverName: doc.driverName ?? '',
    weeks: doc.weeks ?? [],
    note: doc.note || '',
    reply: doc.reply || '',
    created_at: doc.created_at,
    updated_at: doc.updated_at ?? null,
    closed_at: doc.closed_at ?? null,
    closedBy: doc.closedBy?.name ?? null,
    account: doc.userId ? (byId.get(doc.userId.toString()) ?? null) : null,
  }));
}

// For /admin/driver-claims: open disputes oldest first, then the latest
// closed ones.
export async function getCoverDisputes() {
  const [open, closed] = await Promise.all([
    disputes().find({ status: 'open' }).sort({ created_at: 1 }).toArray(),
    disputes()
      .find({ status: 'closed' })
      .sort({ closed_at: -1 })
      .limit(CLOSED_SHOWN)
      .toArray(),
  ]);
  return { open: await shapeForAdmin(open), closed: await shapeForAdmin(closed) };
}

// For the /admin banner and the menu badge. A dispute counts until closed.
export async function getOpenDisputeCount() {
  return disputes().countDocuments({ status: 'open' });
}

/**
 * Closes an open dispute, with an optional answer the driver sees on /covers.
 * What fixes it happens elsewhere: the sheet, or the account's link on its
 * admin user page. → { dispute } (shaped for the admin page) or
 * { error, status }.
 */
export async function closeCoverDispute(disputeId, reply, actor) {
  if (!ObjectId.isValid(disputeId)) return { error: 'Invalid dispute.', status: 400 };
  const doc = await disputes().findOneAndUpdate(
    { _id: new ObjectId(disputeId), status: 'open' },
    { $set: { status: 'closed', reply, closed_at: now(), closedBy: stamp(actor) } },
    { returnDocument: 'after' },
  );
  if (!doc) return { error: 'That dispute is already closed.', status: 409 };
  const [dispute] = await shapeForAdmin([doc]);
  return { dispute };
}

export async function deleteUserCoverDisputes(userId) {
  const { deletedCount } = await disputes().deleteMany({ userId: new ObjectId(userId) });
  return { deletedCoverDisputes: deletedCount };
}
