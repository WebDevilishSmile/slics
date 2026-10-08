import client from '@/lib/db/client';

export async function getAllBidJobs() {
  try {
    const db = client.db();
    const bidJobsCollection = db.collection('bid-jobs');

    // MongoDB sort: 1 for ascending (lowest to highest), -1 for descending
    const bidJobs = await bidJobsCollection.find({}).toArray();

    return bidJobs;
  } catch (error) {
    console.error('Error fetching all bid jobs:', error);
    throw error;
  }
}

