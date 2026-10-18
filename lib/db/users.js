import client from '@/lib/db/client';
import { ObjectId } from 'mongodb';
import { deleteUserSlicComments } from '@/lib/db/comments';
import { deleteUserPlaceData } from '@/lib/db/places';
import { unlinkUserSlicReports } from '@/lib/db/slicReports';
import { deleteUserDriverClaims } from '@/lib/db/driverClaims';
import { deleteUserCoverDisputes } from '@/lib/db/coverDisputes';
import { deleteUserPushSubscriptions } from '@/lib/db/pushSubscriptions';
import { deleteUserCoverLists } from '@/lib/db/coverPreferences';
import { deleteUserPasswordResets } from '@/lib/db/passwordResets';
import { PUSH_TYPES } from '@/constants';
import { getFeatures, getRoleAreas } from '@/lib/db/appSettings';
import { recordAdminAction } from '@/lib/db/adminAudit';

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

// The admin's "seen up to" marks for the on-call sheet's alerts
// (docs/ON-CALL-SHEET-SYNC.md, "Alerts"): the `seenAt` of the newest change
// they've had on screen, `jobChangesSeenAt` for the Jobs tab (/admin/jobs) and
// `coverChangesSeenAt` for cover weeks (/admin/cover/jobs). Kept on the user,
// not the device, so phone and desktop agree. null means every change is new.
async function getSeenMark(userId, field) {
  if (!userId || !ObjectId.isValid(userId)) return null;
  const user = await client
    .db()
    .collection('users')
    .findOne({ _id: new ObjectId(userId) }, { projection: { [field]: 1 } });
  return user?.[field] ?? null;
}

// Moves a mark forward to `upTo` (an ISO string), never back: $max compares
// ISO strings in time order, so an older page posting late can't undo a newer.
async function moveSeenMark(userId, field, upTo) {
  if (!userId || !ObjectId.isValid(userId)) return;
  await client
    .db()
    .collection('users')
    .updateOne({ _id: new ObjectId(userId) }, { $max: { [field]: upTo } });
}

export const getJobChangesSeenAt = (userId) => getSeenMark(userId, 'jobChangesSeenAt');
export const markJobChangesSeen = (userId, upTo) => moveSeenMark(userId, 'jobChangesSeenAt', upTo);
export const getCoverChangesSeenAt = (userId) => getSeenMark(userId, 'coverChangesSeenAt');
export const markCoverChangesSeen = (userId, upTo) => moveSeenMark(userId, 'coverChangesSeenAt', upTo);

// Whether the driver still has the "new app icon" notice due on /home: they
// haven't dismissed it since the icon last changed (ICON_CHANGED_AT, or a
// later time the super admin set with "Ask again" on /admin/super/features).
// Kept on the user, not the device, because removing the iPhone app (which
// the notice asks for) also wipes its storage. Both values are ISO strings,
// which compare in time order.
export async function isIconNoticeDue(userId) {
  if (!userId || !ObjectId.isValid(userId)) return false;
  const [user, { iconChangedAt }] = await Promise.all([
    client
      .db()
      .collection('users')
      .findOne({ _id: new ObjectId(userId) }, { projection: { iconNoticeDismissedAt: 1 } }),
    getFeatures(),
  ]);
  if (!user) return false;
  return !(user.iconNoticeDismissedAt >= iconChangedAt);
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

// The welcome note waiting for someone just made an admin or a dispatcher
// (staff/WelcomeCard.jsx, docs/STAFF-ROLES.md): `users.roleNotice`, set by
// setUserRole (lib/db/admins.js) on a promotion. → { role, at (ISO) } while
// it's waiting and still their role, or null.
export async function getRoleNotice(userId) {
  if (!userId || !ObjectId.isValid(userId)) return null;
  const user = await client
    .db()
    .collection('users')
    .findOne({ _id: new ObjectId(userId) }, { projection: { role: 1, roleNotice: 1 } });
  const notice = user?.roleNotice;
  if (!notice || notice.role !== user.role) return null;
  return { role: notice.role, at: notice.at instanceof Date ? notice.at.toISOString() : null };
}

// The note was opened or dismissed: it doesn't come back.
export async function clearRoleNotice(userId) {
  if (!userId || !ObjectId.isValid(userId)) return;
  await client
    .db()
    .collection('users')
    .updateOne({ _id: new ObjectId(userId) }, { $unset: { roleNotice: '' } });
}

// Covers early access (docs/COVER-BIDDING.md): `users.coversAccess`, `{ at,
// by: { id, name } }` while the super admin has let this account into Covers
// before it opens to every driver (canUseCovers, lib/authz.js), gone
// otherwise. It never keeps anyone out: once Covers is open it changes
// nothing, and it applies again if Covers closes. Written to `admin_audit`
// first. → { user } with the updated row (no password), or { error, status }.
export async function setCoversAccess(targetId, on, actor) {
  if (typeof on !== 'boolean') return { error: 'Say whether to turn it on or off', status: 400 };
  if (!ObjectId.isValid(targetId)) return { error: 'Invalid user id', status: 400 };

  const users = client.db().collection('users');
  const _id = new ObjectId(targetId);
  const target = await users.findOne({ _id }, NO_SECRETS);
  if (!target) return { error: 'User not found', status: 404 };
  if (Boolean(target.coversAccess) === on) return { user: target };

  await recordAdminAction({
    actor,
    action: on ? 'coversAccess.granted' : 'coversAccess.revoked',
    targetType: 'user',
    targetId,
    targetName: target.name,
    from: !on,
    to: on,
  });
  const user = await users.findOneAndUpdate(
    { _id },
    on
      ? { $set: { coversAccess: { at: new Date(), by: { id: actor?.id ?? null, name: actor?.name ?? null } } } }
      : { $unset: { coversAccess: '' } },
    { returnDocument: 'after', ...NO_SECRETS },
  );
  if (!user) return { error: 'User not found', status: 404 };
  return { user };
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
// only, and so does an admin kind whose tool the Admin role doesn't have
// (its `area`, docs/STAFF-ROLES.md). An unknown kind, or a driver kind
// (getDriverPushAudience), goes to nobody.
export async function getPushAudience(key) {
  const type = pushType(key);
  if (!type || type.audience === 'driver') return [];
  const superOnly =
    type.audience === 'superAdmin' ||
    (type.area && !(await getRoleAreas()).admin.includes(type.area));
  const admins = await client
    .db()
    .collection('users')
    .find(
      {
        role: 'admin',
        ...(superOnly ? { superAdmin: true } : {}),
        [`pushPrefs.${key}`]: type.defaultOn ? { $ne: false } : true,
      },
      { projection: { _id: 1 } },
    )
    .toArray();
  return admins.map((admin) => admin._id.toString());
}

// Of `userIds` (strings), the ones who get a driver kind of push `key`
// (docs/PUSH-NOTIFICATIONS.md, stage 2): everyone who hasn't switched it off.
// While the "Notifications for every driver" switch is off only admins count,
// so closing it stops sends to drivers too. → ids (strings).
export async function getDriverPushAudience(key, userIds) {
  const type = pushType(key);
  if (type?.audience !== 'driver') return [];
  const ids = [...new Set((userIds ?? []).map(String))].filter((id) => ObjectId.isValid(id));
  if (ids.length === 0) return [];
  const { pushOpen } = await getFeatures();
  const users = await client
    .db()
    .collection('users')
    .find(
      {
        _id: { $in: ids.map((id) => new ObjectId(id)) },
        ...(pushOpen ? {} : { role: 'admin' }),
        [`pushPrefs.${key}`]: type.defaultOn ? { $ne: false } : true,
      },
      { projection: { _id: 1 } },
    )
    .toArray();
  return users.map((user) => user._id.toString());
}

// The kinds an account may choose: the driver kinds for everyone, the admin
// kinds for an admin whose tools (`areas`, keys; every one when left out)
// include the kind's `area`, the super-admin kinds for a super admin.
export const pushTypesFor = ({ admin = false, superAdmin = false, areas } = {}) =>
  PUSH_TYPES.filter(
    (type) =>
      type.audience === 'driver' ||
      (type.audience === 'admin' && admin && (!type.area || !areas || areas.includes(type.area))) ||
      (type.audience === 'superAdmin' && superAdmin),
  );

// An account's choices as `{ key: boolean }`, every kind it may choose
// resolved against its default. `stored` is the row's `pushPrefs`; `who` is
// pushTypesFor's argument.
export const resolvePushPrefs = (stored, who = {}) =>
  Object.fromEntries(
    pushTypesFor(who).map((type) => [
      type.key,
      typeof stored?.[type.key] === 'boolean' ? stored[type.key] : type.defaultOn,
    ]),
  );

export async function getPushPrefs(userId, who = {}) {
  if (!userId || !ObjectId.isValid(userId)) return resolvePushPrefs(null, who);
  const user = await client
    .db()
    .collection('users')
    .findOne({ _id: new ObjectId(userId) }, { projection: { pushPrefs: 1 } });
  return resolvePushPrefs(user?.pushPrefs, who);
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
    // So do their "This is a mistake" messages about the cover list.
    const coverDisputes = await deleteUserCoverDisputes(userId);
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
      ...coverDisputes,
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
