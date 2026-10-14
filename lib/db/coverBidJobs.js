import client from '@/lib/db/client';
import { ObjectId } from 'mongodb';
import { HttpError } from '@/lib/httpError';
import { diffCoverJobs, saveCoverJobChanges } from '@/lib/db/coverJobChanges';

function toUserStamp(user) {
  if (!user) return null;
  return {
    id: user.id || null,
    name: user.name || null,
    email: user.email || null,
  };
}

export async function createCoverBidJobs(rows, weekEnding, user) {
  try {
    if (!weekEnding) {
      throw new HttpError(400, 'weekEnding is required');
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new HttpError(400, 'rows must be a non-empty array');
    }

    const requiredFields = [
      'jobNumber',
      'name',
      'assignedDriver',
      'coverReason',
      'sun',
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat',
      'description',
    ];

    rows.forEach((row, index) => {
      const missingFields = requiredFields.filter(
        (field) => row[field] === undefined || row[field] === null
      );
      if (missingFields.length > 0) {
        throw new HttpError(
          400,
          `Row ${index + 1} is missing required fields: ${missingFields.join(', ')}`
        );
      }
    });

    const db = client.db();
    const coverBidJobsCollection = db.collection('cover-bid-jobs');

    const lastRow = await coverBidJobsCollection
      .find({ weekEnding })
      .sort({ sortOrder: -1 })
      .limit(1)
      .toArray();
    const startOrder =
      lastRow.length > 0 && typeof lastRow[0].sortOrder === 'number'
        ? lastRow[0].sortOrder + 1
        : 0;

    const createdBy = toUserStamp(user);
    const created_at = new Date().toISOString();

    const documents = rows.map((row, index) => ({
      weekEnding,
      jobNumber: row.jobNumber,
      name: row.name,
      assignedDriver: row.assignedDriver,
      coverReason: row.coverReason,
      sun: row.sun,
      mon: row.mon,
      tue: row.tue,
      wed: row.wed,
      thu: row.thu,
      fri: row.fri,
      sat: row.sat,
      description: row.description,
      sortOrder: startOrder + index,
      created_at,
      createdBy,
    }));

    const result = await coverBidJobsCollection.insertMany(documents);

    return documents.map((doc, index) => ({
      _id: result.insertedIds[index],
      ...doc,
    }));
  } catch (error) {
    console.error('Error creating cover bid jobs:', error);
    throw error;
  }
}

const JOB_FIELDS = [
  'jobNumber',
  'name',
  'assignedDriver',
  'coverReason',
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'description',
];

const sameJobs = (a, b) =>
  a.length === b.length &&
  a.every((job, index) =>
    JOB_FIELDS.every((field) => (job[field] ?? '') === (b[index][field] ?? ''))
  );

// Jobs typed in or uploaded from a photo, which a sheet refresh would replace.
export async function countUploadedCoverBidJobs(weekEnding) {
  const db = client.db();
  return db
    .collection('cover-bid-jobs')
    .countDocuments({ weekEnding, source: { $ne: 'sheet' } });
}

// Makes the week's jobs the sheet's (docs/ON-CALL-SHEET-SYNC.md). When nothing
// changed it writes nothing, so _ids stay put. Otherwise it records what
// changed in `cover-job-changes` (lib/db/coverJobChanges.js) first, then
// inserts the new rows before deleting the old ones: a failure in between
// leaves the week doubled, never empty, and at worst records a change twice
// rather than losing it. `source` is what started the read ('refresh', 'ping'
// or 'cron'). Returns { changed, created, changes (rows recorded) }.
export async function replaceCoverBidJobsForWeek(weekEnding, rows, user, { source = 'refresh' } = {}) {
  try {
    if (!weekEnding) {
      throw new HttpError(400, 'weekEnding is required');
    }

    const db = client.db();
    const coverBidJobsCollection = db.collection('cover-bid-jobs');

    const existing = await coverBidJobsCollection
      .find({ weekEnding })
      .sort({ sortOrder: 1 })
      .toArray();

    if (existing.every((job) => job.source === 'sheet') && sameJobs(existing, rows)) {
      return { changed: false, created: false, changes: 0 };
    }

    const createdBy = toUserStamp(user);
    const created_at = new Date().toISOString();

    const changes = diffCoverJobs(weekEnding, existing, rows, { source, at: created_at });
    await saveCoverJobChanges(changes);

    if (rows.length > 0) {
      await coverBidJobsCollection.insertMany(
        rows.map((row, index) => ({
          weekEnding,
          ...Object.fromEntries(JOB_FIELDS.map((field) => [field, row[field] ?? ''])),
          sortOrder: index,
          source: 'sheet',
          created_at,
          createdBy,
        }))
      );
    }

    if (existing.length > 0) {
      await coverBidJobsCollection.deleteMany({
        _id: { $in: existing.map((job) => job._id) },
      });
    }

    // `created`: the week had no jobs before, so it was just posted.
    return { changed: true, created: existing.length === 0, changes: changes.length };
  } catch (error) {
    console.error('Error replacing cover bid jobs from the sheet:', error);
    throw error;
  }
}

export async function getAllCoverBidJobs() {
  try {
    const db = client.db();
    const coverBidJobsCollection = db.collection('cover-bid-jobs');

    return await coverBidJobsCollection
      .find({})
      .sort({ weekEnding: -1, sortOrder: 1 })
      .toArray();
  } catch (error) {
    console.error('Error fetching all cover bid jobs:', error);
    throw error;
  }
}

// weekEnding is a zero-padded 'YYYY-MM-DD' string, so a lexicographic $gte is a
// correct date comparison.
export async function getCoverBidJobsSince(weekEndingFrom) {
  try {
    if (!weekEndingFrom) {
      throw new HttpError(400, 'weekEndingFrom is required');
    }

    const db = client.db();
    const coverBidJobsCollection = db.collection('cover-bid-jobs');

    return await coverBidJobsCollection
      .find({ weekEnding: { $gte: weekEndingFrom } })
      .sort({ weekEnding: -1, sortOrder: 1 })
      .toArray();
  } catch (error) {
    console.error('Error fetching recent cover bid jobs:', error);
    throw error;
  }
}

export async function getCoverBidJobsByWeek(weekEnding) {
  try {
    if (!weekEnding) {
      throw new HttpError(400, 'weekEnding is required');
    }

    const db = client.db();
    const coverBidJobsCollection = db.collection('cover-bid-jobs');

    return await coverBidJobsCollection
      .find({ weekEnding })
      .sort({ sortOrder: 1 })
      .toArray();
  } catch (error) {
    console.error('Error fetching cover bid jobs by week:', error);
    throw error;
  }
}

// Distinct weeks that have at least one job, newest first. Used to flag posted
// weeks on the calendars without pulling the jobs themselves.
export async function getCoverBidJobWeeks() {
  try {
    const db = client.db();
    const coverBidJobsCollection = db.collection('cover-bid-jobs');

    // $group rather than .distinct(): the shared client runs Stable API v1 with
    // strict: true (lib/db/client.js), and `distinct` is not in that command set.
    const weeks = await coverBidJobsCollection
      .aggregate([
        { $match: { weekEnding: { $type: 'string' } } },
        { $group: { _id: '$weekEnding' } },
        { $sort: { _id: -1 } },
      ])
      .toArray();

    return weeks.map((week) => week._id);
  } catch (error) {
    console.error('Error fetching cover bid job weeks:', error);
    throw error;
  }
}

export async function updateCoverBidJob(id, updates, user) {
  try {
    if (!id || !ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid cover bid job ID');
    }

    const db = client.db();
    const coverBidJobsCollection = db.collection('cover-bid-jobs');

    const result = await coverBidJobsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updated_at: new Date().toISOString(),
          updatedBy: toUserStamp(user),
        },
      }
    );

    if (result.matchedCount === 0) {
      throw new HttpError(404, `Cover bid job with ID "${id}" not found`);
    }

    return result;
  } catch (error) {
    console.error('Error updating cover bid job:', error);
    throw error;
  }
}

export async function deleteCoverBidJob(id) {
  try {
    if (!id || !ObjectId.isValid(id)) {
      throw new HttpError(400, 'Invalid cover bid job ID');
    }

    const objectId = new ObjectId(id);
    const db = client.db();
    const coverBidJobsCollection = db.collection('cover-bid-jobs');

    const existing = await coverBidJobsCollection.findOne({ _id: objectId });

    if (!existing) {
      throw new HttpError(404, `Cover bid job with ID "${id}" not found`);
    }

    await coverBidJobsCollection.deleteOne({ _id: objectId });

    return { success: true, deletedId: id };
  } catch (error) {
    console.error('Error deleting cover bid job:', error);
    throw error;
  }
}

export async function deleteCoverBidJobsByWeek(weekEnding) {
  try {
    if (!weekEnding) {
      throw new HttpError(400, 'weekEnding is required');
    }

    const db = client.db();
    const coverBidJobsCollection = db.collection('cover-bid-jobs');

    const result = await coverBidJobsCollection.deleteMany({ weekEnding });

    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    console.error('Error deleting cover bid jobs by week:', error);
    throw error;
  }
}

export function serializeCoverBidJob(job) {
  return {
    ...job,
    _id: job._id.toString(),
  };
}

export function serializeCoverBidJobs(jobs) {
  return jobs.map(serializeCoverBidJob);
}
