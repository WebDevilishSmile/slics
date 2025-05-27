import client from '@/lib/db';

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
