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
