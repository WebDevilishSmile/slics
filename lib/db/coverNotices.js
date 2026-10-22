import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { addDays } from '@/lib/bidDay';
import { COVER_LIST_KEEP_DAYS } from '@/constants';

// What the Covers notifications cron has already sent (lib/coverNotices.js,
// docs/PUSH-NOTIFICATIONS.md stage 3), so a notification goes out once
// however often the cron runs, and two runs at the same moment can't both
// send it.
//
// `cover-notices`: one doc per thing told, keyed by `key` (unique):
//   reminder:<userId>:<week>:<lead>:<slot>  a call-in reminder, written
//       before it's sent (the run whose insert wins sends it)
//   callIn:<userId>:<week>   the place and call-in last told, as `state`
//   week:<week>              how far the week's job changes were told
//       (`through`, the newest change's seenAt)
//   weeks:baseline           when the cron first ran: changes from before
//       it aren't told
// Each also has { kind, userId?, weekEnding?, at, expiresAt }. A TTL deletes
// it COVER_LIST_KEEP_DAYS after its week ends, like the lists. Account
// deletion deletes the account's.

const NOTICES = 'cover-notices';

const notices = () => client.db().collection(NOTICES);

export function noticeExpiresAt(weekEnding) {
  return new Date(`${addDays(weekEnding, COVER_LIST_KEEP_DAYS + 1)}T00:00:00Z`);
}

const isDuplicateKey = (error) => error?.code === 11000;

// Writes a notice that wasn't there. → true when this call wrote it, false
// when it was already there (sent before, or by a run at the same moment).
export async function claimNotice(key, fields) {
  try {
    await notices().insertOne({ key, ...fields, at: new Date() });
    return true;
  } catch (error) {
    if (isDuplicateKey(error)) return false;
    throw error;
  }
}

// The notices with these keys, as a Map of key → doc.
export async function getNotices(keys) {
  if (keys.length === 0) return new Map();
  const docs = await notices()
    .find({ key: { $in: keys } })
    .toArray();
  return new Map(docs.map((doc) => [doc.key, doc]));
}

export async function getNotice(key) {
  return notices().findOne({ key });
}

// Moves a notice from what this run read (`expected`, e.g. { state }) to
// `next`. → true when this call moved it; false when another run got there
// first, so only one of them sends.
export async function moveNotice(key, expected, next) {
  const { modifiedCount } = await notices().updateOne(
    { key, ...expected },
    { $set: { ...next, at: new Date() } },
  );
  return modifiedCount === 1;
}

// Account deletion (lib/db/users.js deleteUserAccount).
export async function deleteUserCoverNotices(userId) {
  const { deletedCount } = await notices().deleteMany({ userId: new ObjectId(userId) });
  return deletedCount;
}
