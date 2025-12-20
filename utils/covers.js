import client from '@/lib/db';

export async function getCovers() {
  try {
    const db = client.db();
    const coversCollection = db.collection('cover');

    // MongoDB sort: 1 for ascending (lowest to highest), -1 for descending
    const covers = await coversCollection
      .find({})
      .sort({ position: 1 })
      .toArray();

    return covers;
  } catch (error) {
    console.error('Error fetching all covers:', error);
    throw error;
  }
}
