import client from '@/lib/db/client';
import { HttpError } from '@/lib/httpError';
import { hideKey, jobKey } from '@/lib/coverBidJobRow';

// Cover jobs an admin hid from drivers (docs/COVER-JOB-HIDING.md).
//
// `cover-bid-job-hides`: one doc per hidden job, by week and job number
// rather than by the job's _id, which every sheet refresh replaces:
//   { weekEnding, jobKey, jobNumber (as the sheet spelled it), hiddenAt,
//     hiddenBy: { id, name } }
// Showing the job again deletes its doc. No refresh, ping or cron touches it.

const HIDES = 'cover-bid-job-hides';

function requireKey(jobNumber) {
  const key = jobKey(jobNumber);
  if (!key) {
    throw new HttpError(400, "A job with no job number can't be hidden");
  }
  return key;
}

// Every hide from `weekEndingFrom` on, as a Set of hideKeys (isJobHidden).
// weekEnding is a zero-padded 'YYYY-MM-DD' string, so $gte compares dates.
export async function getHiddenJobKeys(weekEndingFrom) {
  const db = client.db();
  const hides = await db
    .collection(HIDES)
    .find({ weekEnding: { $gte: weekEndingFrom } }, { projection: { weekEnding: 1, jobKey: 1 } })
    .toArray();
  return new Set(hides.map((hide) => hideKey(hide.weekEnding, hide.jobKey)));
}

// One week's hides for the admin manager: who hid each job, and when.
export async function getWeekHides(weekEnding) {
  const db = client.db();
  const hides = await db.collection(HIDES).find({ weekEnding }).toArray();
  return hides.map(toHide);
}

function toHide(hide) {
  return {
    jobKey: hide.jobKey,
    jobNumber: hide.jobNumber,
    hiddenAt: hide.hiddenAt,
    hiddenBy: { name: hide.hiddenBy?.name ?? null },
  };
}

// Hiding a hidden job changes nothing, so a second tap is harmless.
export async function hideCoverBidJob(weekEnding, jobNumber, user) {
  const key = requireKey(jobNumber);
  const db = client.db();
  const hide = await db.collection(HIDES).findOneAndUpdate(
    { weekEnding, jobKey: key },
    {
      $setOnInsert: {
        weekEnding,
        jobKey: key,
        jobNumber: jobNumber.trim(),
        hiddenAt: new Date().toISOString(),
        hiddenBy: { id: user?.id ?? null, name: user?.name ?? null },
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  return toHide(hide);
}

export async function showCoverBidJob(weekEnding, jobNumber) {
  const key = requireKey(jobNumber);
  const db = client.db();
  await db.collection(HIDES).deleteOne({ weekEnding, jobKey: key });
}
