import client from '@/lib/db/client';
import { ObjectId } from 'mongodb';
import { deleteUserSlicComments } from '@/lib/db/comments';
import { deleteUserPlaceData } from '@/lib/db/places';
import { unlinkUserSlicReports } from '@/lib/db/slicReports';
import { deleteUserDriverClaims } from '@/lib/db/driverClaims';
import { deleteUserPushSubscriptions } from '@/lib/db/pushSubscriptions';
import { deleteUserCoverLists } from '@/lib/db/coverPreferences';
import { deleteUserPasswordResets } from '@/lib/db/passwordResets';
import { ICON_CHANGED_AT, PUSH_TYPES } from '@/constants';

// Reads here never return the password hash; only auth.js's `authorize()`
// reads it, straight from the collection (docs/SECURITY.md #6).
const NO_SECRETS = { projection: { password: 0 } };

export async function getUsers() {
  try {
    const db = client.db();
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}, NO_SECRETS).toArray();

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const db = client.db();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) }, NO_SECRETS);

    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Public-facing author data for comment attribution. Deliberately projects to
 * only the fields the UI renders — the full user document carries the bcrypt
 * password hash and email, which must never reach the client.
 */
export async function getPublicUserById(userId) {
  try {
    if (!userId || !ObjectId.isValid(userId)) {
      return null;
    }
    const db = client.db();
    const usersCollection = db.collection('users');

    return await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { name: 1, image: 1 } }
    );
  } catch (error) {
    console.error('Error fetching public user:', error);
    throw error;
  }
}

// The admin's "seen up to" mark for Jobs-tab changes (docs/ON-CALL-SHEET-SYNC.md,
// stage 3 alerts): the `seenAt` of the newest change they've had on screen.
// Kept on the user, not the device, so phone and desktop agree. null means
// every change is new.
export async function getJobChangesSeenAt(userId) {
  if (!userId || !ObjectId.isValid(userId)) return null;
  const user = await client
    .db()
    .collection('users')
    .findOne({ _id: new ObjectId(userId) }, { projection: { jobChangesSeenAt: 1 } });
  return user?.jobChangesSeenAt ?? null;
}

// Moves the mark forward to `upTo` (an ISO string), never back: $max compares
// ISO strings in time order, so an older page posting late can't undo a newer.
export async function markJobChangesSeen(userId, upTo) {
  if (!userId || !ObjectId.isValid(userId)) return;
  await client
    .db()
    .collection('users')
    .updateOne({ _id: new ObjectId(userId) }, { $max: { jobChangesSeenAt: upTo } });
}

// Whether the driver still has the "new app icon" notice due on /home: they
// haven't dismissed it since the icon last changed. Kept on the user, not the
// device, because removing the iPhone app (which the notice asks for) also
// wipes its storage. Both values are ISO strings, which compare in time order.
export async function isIconNoticeDue(userId) {
  if (!userId || !ObjectId.isValid(userId)) return false;
  const user = await client
    .db()
    .collection('users')
    .findOne({ _id: new ObjectId(userId) }, { projection: { iconNoticeDismissedAt: 1 } });
  if (!user) return false;
  return !(user.iconNoticeDismissedAt >= ICON_CHANGED_AT);
}

export async function dismissIconNotice(userId) {
  if (!userId || !ObjectId.isValid(userId)) return;
  await client
    .db()
    .collection('users')
    .updateOne(
      { _id: new ObjectId(userId) },
      { $set: { iconNoticeDismissedAt: new Date().toISOString() } },
    );
}

// The ids (strings) of the accounts that sign in with a password, for the
// "Reset password" action on /admin/users. Google accounts have none.
export async function getPasswordUserIds() {
  const users = await client
    .db()
    .collection('users')
    .find({ password: { $type: 'string' } }, { projection: { _id: 1 } })
    .toArray();
  return new Set(users.map((user) => user._id.toString()));
}

// Whether one account signs in with a password (/profile's "Change
// password"), without reading the hash.
export async function userHasPassword(userId) {
  const count = await client
    .db()
    .collection('users')
    .countDocuments({ _id: new ObjectId(userId), password: { $type: 'string' } }, { limit: 1 });
  return count > 0;
}

const pushType = (key) => PUSH_TYPES.find((type) => type.key === key) ?? null;

// The ids (strings) of the admins who get push notifications of kind `key`
// (PUSH_TYPES in constants.js, docs/PUSH-NOTIFICATIONS.md stage 1b): every
// admin unless they switched it off for a kind that's on by default, only the
// ones who switched it on otherwise. A super-admin kind goes to super admins
// only. An unknown kind goes to nobody.
export async function getPushAudience(key) {
  const type = pushType(key);
  if (!type) return [];
  const admins = await client
    .db()
    .collection('users')
    .find(
      {
        role: 'admin',
        ...(type.audience === 'superAdmin' ? { superAdmin: true } : {}),
        [`pushPrefs.${key}`]: type.defaultOn ? { $ne: false } : true,
      },
      { projection: { _id: 1 } },
    )
    .toArray();
  return admins.map((admin) => admin._id.toString());
}

// The kinds an account may choose, given whether it's a super admin's.
export const pushTypesFor = ({ superAdmin = false } = {}) =>
  PUSH_TYPES.filter((type) => type.audience === 'admin' || superAdmin);

// An account's choices as `{ key: boolean }`, every kind it may choose
// resolved against its default. `stored` is the row's `pushPrefs`.
export const resolvePushPrefs = (stored, { superAdmin = false } = {}) =>
  Object.fromEntries(
    pushTypesFor({ superAdmin }).map((type) => [
      type.key,
      typeof stored?.[type.key] === 'boolean' ? stored[type.key] : type.defaultOn,
    ]),
  );

export async function getPushPrefs(userId, { superAdmin = false } = {}) {
  if (!userId || !ObjectId.isValid(userId)) return resolvePushPrefs(null, { superAdmin });
  const user = await client
    .db()
    .collection('users')
    .findOne({ _id: new ObjectId(userId) }, { projection: { pushPrefs: 1 } });
  return resolvePushPrefs(user?.pushPrefs, { superAdmin });
}

// One switch on /profile. The caller has checked the key is one this account
// may choose. Applies to all of the account's devices.
export async function setPushPref(userId, key, on) {
  await client
    .db()
    .collection('users')
    .updateOne({ _id: new ObjectId(userId) }, { $set: { [`pushPrefs.${key}`]: on } });
}

export async function getSlicViewCounts() {
  try {
    const db = client.db();
    const counts = await db
      .collection('slicViews')
      .aggregate([{ $group: { _id: '$userId', count: { $sum: 1 } } }])
      .toArray();

    return counts.reduce((map, entry) => {
      map[entry._id.toString()] = entry.count;
      return map;
    }, {});
  } catch (error) {
    console.error('Error fetching slic view counts:', error);
    return {};
  }
}

/**
 * Removes a user and everything keyed by them. Dependent data goes first and
 * the user row last, so a failure part-way leaves an account the user can
 * retry from rather than orphaned comments (which render as a permanent
 * "Loading comment…" on the home page once their author is gone).
 *
 * `comments.userId` and the vote arrays hold the id as a string; `slicViews`
 * and the Auth.js `accounts` collection hold it as an ObjectId.
 *
 * Left alone on purpose: the `{ id, name, email }` audit stamps in
 * `slic_history`, `slics.createdBy/updatedBy` and `cover-bid-jobs` (written
 * only by admins, who can't use this flow), and `rateLimits` (TTL-expired).
 */
export async function deleteUserAccount(userId) {
  try {
    if (!userId || !ObjectId.isValid(userId)) {
      throw new Error('Valid user ID is required');
    }
    const db = client.db();
    const objectId = new ObjectId(userId);

    // Where other drivers replied, a comment becomes a "Comment deleted"
    // placeholder so their replies keep their thread.
    const comments = await deleteUserSlicComments(userId);
    const gymComments = await db
      .collection('gymComments')
      .deleteMany({ userId });
    const votes = await db
      .collection('comments')
      .updateMany({}, { $pull: { upVotes: userId, downVotes: userId } });
    const placeData = await deleteUserPlaceData(userId);
    const views = await db
      .collection('slicViews')
      .deleteMany({ userId: objectId });
    const accounts = await db
      .collection('accounts')
      .deleteMany({ userId: objectId });
    // Buy Me a Coffee events stay as the record of support, unlinked from the
    // account (privacy page, "How long we keep information").
    const bmcEvents = await db
      .collection('bmc-events')
      .updateMany({ userId: objectId }, { $set: { userId: null } });
    // SLIC reports stay too, since they're about the SLIC.
    const slicReports = await unlinkUserSlicReports(userId);
    // Driver verification claims hold an employee ID until decided; they go.
    const driverClaims = await deleteUserDriverClaims(userId);
    // Push subscriptions are per device; none outlive the account.
    const pushSubscriptions = await deleteUserPushSubscriptions(userId);
    // Cover lists (docs/COVER-BIDDING.md, stage 2) are the driver's own.
    const coverLists = await deleteUserCoverLists(userId);
    const passwordResets = await deleteUserPasswordResets(userId);
    const user = await db.collection('users').deleteOne({ _id: objectId });

    if (user.deletedCount === 0) {
      throw new Error('User not found');
    }

    return {
      ...comments,
      deletedGymComments: gymComments.deletedCount,
      votesPulled: votes.modifiedCount,
      deletedViews: views.deletedCount,
      deletedAccounts: accounts.deletedCount,
      unlinkedBmcEvents: bmcEvents.modifiedCount,
      ...slicReports,
      ...driverClaims,
      ...pushSubscriptions,
      deletedCoverLists: coverLists,
      ...passwordResets,
      ...placeData,
    };
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}
