import client from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function getUsers() {
  try {
    const db = client.db('test');
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
    const db = client.db('test');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export async function getUserByEmail(email) {
  try {
    if (!email) {
      throw new Error('Email is required');
    }
    const db = client.db('test');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email });

    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

export async function toggleMembershipApi(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const db = client.db('test');
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
