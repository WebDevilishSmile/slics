import client from '@/lib/db';

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

export function serializeBidJob(job) {
  return { ...job, _id: job._id.toString() };
}

export function serializeBidJobs(jobs) {
  return jobs.map(serializeBidJob);
}
