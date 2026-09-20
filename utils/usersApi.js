import client from '@/lib/db';
import { ObjectId } from 'mongodb';

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

    const comments = await db.collection('comments').deleteMany({ userId });
    const votes = await db
      .collection('comments')
      .updateMany({}, { $pull: { upVotes: userId, downVotes: userId } });
    const views = await db
      .collection('slicViews')
      .deleteMany({ userId: objectId });
    const accounts = await db
      .collection('accounts')
      .deleteMany({ userId: objectId });
    const user = await db.collection('users').deleteOne({ _id: objectId });

    if (user.deletedCount === 0) {
      throw new Error('User not found');
    }

    return {
      deletedComments: comments.deletedCount,
      votesPulled: votes.modifiedCount,
      deletedViews: views.deletedCount,
      deletedAccounts: accounts.deletedCount,
    };
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}
