import client from '@/lib/db';

export async function getAllDrivers() {
  try {
    const db = client.db();
    const driversCollection = db.collection('drivers');

    // MongoDB sort: 1 for ascending (lowest to highest), -1 for descending
    const drivers = await driversCollection
      .find({})
      .sort({ seniorityDate: 1 })
      .toArray();

    return drivers;
  } catch (error) {
    console.error('Error fetching all drivers:', error);
    throw error;
  }
}
