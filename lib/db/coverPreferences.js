import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { COVER_LIST_KEEP_DAYS } from '@/constants';
import { displayName } from '@/lib/names';

// Verified drivers' cover lists (docs/COVER-BIDDING.md, stage 2).
//
// `cover-preferences`: one doc per driver per week:
//   { userId: ObjectId, weekEnding: 'YYYY-MM-DD', entries: [{ jobKey,
//     jobNumber }] (lib/coverList.js), updatedAt, expiresAt: Date }
// `expiresAt` is COVER_LIST_KEEP_DAYS after the week's Saturday; a TTL index
// (scripts/createIndexes.js) deletes the doc then, so only the last four
// weeks are kept, for checking afterwards. Account deletion deletes them all.
// Taken jobs stay in `entries`; reading a list sorts them out
// (coverListStatus).

const LISTS = 'cover-preferences';

function expiresAt(weekEnding) {
  const date = new Date(`${weekEnding}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + COVER_LIST_KEEP_DAYS + 1);
  return date;
}

// One week's list, [] when the driver has none.
export async function getMyCoverList(userId, weekEnding) {
  const db = client.db();
  const doc = await db
    .collection(LISTS)
    .findOne({ userId: new ObjectId(userId), weekEnding }, { projection: { entries: 1 } });
  return doc?.entries ?? [];
}

// Every list of the driver's from `weekEndingFrom` on, as { weekEnding:
// entries }. weekEnding is a zero-padded 'YYYY-MM-DD', so $gte compares dates.
export async function getMyCoverLists(userId, weekEndingFrom) {
  const db = client.db();
  const docs = await db
    .collection(LISTS)
    .find(
      { userId: new ObjectId(userId), weekEnding: { $gte: weekEndingFrom } },
      { projection: { weekEnding: 1, entries: 1 } },
    )
    .toArray();
  return Object.fromEntries(docs.map((doc) => [doc.weekEnding, doc.entries ?? []]));
}

// Replaces the driver's list for the week (entries already cleaned and
// checked by the route). An empty list deletes the doc.
export async function saveMyCoverList(userId, weekEnding, entries) {
  const db = client.db();
  const filter = { userId: new ObjectId(userId), weekEnding };
  if (entries.length === 0) {
    await db.collection(LISTS).deleteOne(filter);
    return [];
  }
  await db.collection(LISTS).updateOne(
    filter,
    {
      $set: { entries, updatedAt: new Date().toISOString(), expiresAt: expiresAt(weekEnding) },
      $setOnInsert: { ...filter },
    },
    { upsert: true },
  );
  return entries;
}

// Admins: every driver's list for the week, with the account's name and the
// sheet name it's linked to, newest change first.
export async function getWeekCoverLists(weekEnding) {
  const db = client.db();
  const docs = await db
    .collection(LISTS)
    .aggregate([
      { $match: { weekEnding } },
      { $sort: { updatedAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1, 'driver.name': 1 } }],
        },
      },
    ])
    .toArray();
  return docs.map((doc) => ({
    userId: doc.userId.toString(),
    name: displayName(doc.user[0]?.name ?? null),
    driverName: doc.user[0]?.driver?.name ?? null,
    entries: doc.entries ?? [],
    updatedAt: doc.updatedAt,
  }));
}

// Every driver's list for the week, as a Map of userId (string) → entries:
// what a call-in reminder reads off (lib/coverNotices.js).
export async function getWeekListEntries(weekEnding) {
  const docs = await client
    .db()
    .collection(LISTS)
    .find({ weekEnding }, { projection: { userId: 1, entries: 1 } })
    .toArray();
  return new Map(docs.map((doc) => [doc.userId.toString(), doc.entries ?? []]));
}

// The week's lists that hold any of `jobKeys`, as [{ userId (string),
// entries }]: who to tell when one of those jobs is taken
// (notifyCoverListTaken, lib/pushEvents.js).
export async function getCoverListsWithJobs(weekEnding, jobKeys) {
  if (jobKeys.length === 0) return [];
  const docs = await client
    .db()
    .collection(LISTS)
    .find({ weekEnding, 'entries.jobKey': { $in: jobKeys } }, { projection: { userId: 1, entries: 1 } })
    .toArray();
  return docs.map((doc) => ({ userId: doc.userId.toString(), entries: doc.entries ?? [] }));
}

// Account deletion (lib/db/users.js deleteUserAccount).
export async function deleteUserCoverLists(userId) {
  const db = client.db();
  const { deletedCount } = await db
    .collection(LISTS)
    .deleteMany({ userId: new ObjectId(userId) });
  return deletedCount;
}
