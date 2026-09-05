import { ObjectId } from 'mongodb';
import client from '@/lib/db';

const VIEWS_COLLECTION = 'slicViews';

export async function getSlicViewsByUserId(userId) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const db = client.db();
    const views = await db
      .collection(VIEWS_COLLECTION)
      .find({ userId: new ObjectId(userId) })
      .sort({ viewedAt: -1 })
      .toArray();

    return views;
  } catch (error) {
    console.error('Error fetching slic views by user ID:', error);
    throw error;
  }
}
