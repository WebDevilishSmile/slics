import client from '@/lib/db/client';
import { ObjectId } from 'mongodb';
import { deleteUserSlicComments } from '@/lib/db/comments';
import { deleteUserPlaceData } from '@/lib/db/places';

export async function getUsers() {
  try {
    const db = client.db();
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();

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

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

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

export async function getUserByEmail(email) {
  try {
    if (!email) {
      throw new Error('Email is required');
    }
    const db = client.db();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email });

    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
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

export async function toggleMembershipApi(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const db = client.db();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { bmcMember: !user.bmcMember } },
      { returnDocument: 'after' }
    );

    return updatedUser.value;
  } catch (error) {
    console.error('Error toggling membership:', error);
    throw error;
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
      ...placeData,
    };
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}
