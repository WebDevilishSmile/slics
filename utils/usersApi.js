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
