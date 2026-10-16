import client from '@/lib/db/client';
import { ObjectId } from 'mongodb';
import { HttpError } from '@/lib/httpError';
import { addSlicHistoryEntry, diffSlicFields } from '@/lib/db/slicHistory';
import { stopKey } from '@/lib/jobRoutes';

export function toUserStamp(user) {
  if (!user) return null;
  return {
    id: user.id || null,
    name: user.name || null,
    email: user.email || null,
  };
}

export async function createSlic(slicData, user) {
  try {
    // Validate required fields
    const requiredFields = ['type', 'numSlic', 'alphaSlic', 'address'];
    const missingFields = requiredFields.filter((field) => !slicData[field]);

    if (missingFields.length > 0) {
      throw new HttpError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate address structure
    if (
      !slicData.address.street ||
      !slicData.address.city ||
      !slicData.address.state ||
      !slicData.address.zip
    ) {
      throw new HttpError(400, 'Address must include street, city, and zip');
    }

    const db = client.db();
    const slicsCollection = db.collection('slics');

    // Check if slic with same numSlic or alphaSlic already exists
    const existingSlic = await slicsCollection.findOne({
      $or: [{ numSlic: slicData.numSlic }, { alphaSlic: slicData.alphaSlic }],
    });

    if (existingSlic) {
      throw new HttpError(
        409,
        `Slic with numSlic "${slicData.numSlic}" or alphaSlic "${slicData.alphaSlic}" already exists`
      );
    }

    // Create the document
    const slicDocument = {
      created_at: new Date().toISOString(),
      createdBy: toUserStamp(user),
      updated_at: null,
      updatedBy: null,
      type: slicData.type,
      numSlic: slicData.numSlic,
      alphaSlic: slicData.alphaSlic,
      name: slicData.name,
      phone: slicData.phone,
      address: {
        street: slicData.address.street,
        city: slicData.address.city,
        state: slicData.address.state,
        zip: slicData.address.zip,
      },
      directions: slicData.directions || null,
      // Set by the admin upload route (app/api/slics/[id]/pdf) after creation
      pdfUrl: null,
    };

    const result = await slicsCollection.insertOne(slicDocument);

    await addSlicHistoryEntry({
      slicId: result.insertedId,
      numSlic: slicDocument.numSlic,
      action: 'created',
      changes: null,
      user,
    });

    return {
      _id: result.insertedId,
      ...slicDocument,
    };
  } catch (error) {
    console.error('Error creating slic:', error);
    throw error;
  }
}

// Keyed by _id like deleteSlic/getSlicById, so the [id] route segment means
// the same thing for every method. `numSlic` is deliberately immutable here:
// comments, slic_history and slicViews are all keyed by it, so changing it
// would silently orphan them.
export async function updateSlic(slicId, updates, user) {
  try {
    if (!slicId) {
      throw new HttpError(400, 'Slic ID is required');
    }

    if (!ObjectId.isValid(slicId)) {
      throw new HttpError(400, 'Invalid slic ID format');
    }

    const db = client.db();
    const slicsCollection = db.collection('slics');

    const existingSlic = await slicsCollection.findOne({
      _id: new ObjectId(slicId),
    });

    if (!existingSlic) {
      throw new HttpError(404, `Slic with ID "${slicId}" not found`);
    }

    // _id is immutable in MongoDB ($set on it throws); numSlic is immutable here.
    const { _id, ...safeUpdates } = updates;

    if (
      safeUpdates.numSlic !== undefined &&
      String(safeUpdates.numSlic) !== String(existingSlic.numSlic)
    ) {
      throw new HttpError(
        400,
        'numSlic cannot be changed: comments, history and view counts are linked to it'
      );
    }

    const numSlic = existingSlic.numSlic;
    const changes = diffSlicFields(existingSlic, safeUpdates);

    const updatedFields = {
      ...safeUpdates,
      updated_at: new Date().toISOString(),
      updatedBy: toUserStamp(user),
    };

    const result = await slicsCollection.updateOne(
      { _id: existingSlic._id },
      { $set: updatedFields }
    );

    if (changes.length > 0) {
      await addSlicHistoryEntry({
        slicId: existingSlic._id,
        numSlic,
        action: 'updated',
        changes,
        user,
      });
    }

    // `changed`: something a driver would see differs, the same test as the
    // history entry (the routes notify on it).
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      numSlic,
      changed: changes.length > 0,
    };
  } catch (error) {
    console.error('Error updating slic:', error);
    throw error;
  }
}

// Fields a deleted SLIC's history entry leaves out: its id and the stamps the
// entry itself records again.
const NOT_IN_DELETE_HISTORY = new Set(['_id', 'created_at', 'updated_at', 'createdBy', 'updatedBy']);

// `user` is who deleted it (the session's user). The history entry lists
// every field the SLIC had, so a mistaken delete can be put back by hand.
export async function deleteSlic(slicId, user) {
  try {
    if (!slicId) {
      throw new HttpError(400, 'Slic ID is required');
    }

    if (!ObjectId.isValid(slicId)) {
      throw new HttpError(400, 'Invalid slic ID format');
    }

    const objectId = new ObjectId(slicId);
    const db = client.db();
    const slicsCollection = db.collection('slics');

    const existingSlic = await slicsCollection.findOne({ _id: objectId });

    if (!existingSlic) {
      throw new HttpError(404, `Slic with ID "${slicId}" not found`);
    }

    const result = await slicsCollection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      throw new Error('Failed to delete slic');
    }

    // Dispatch can delete SLICs too (docs/STAFF-ROLES.md), so a delete is on
    // record like a create or an edit (SECURITY.md #17).
    await addSlicHistoryEntry({
      slicId: objectId,
      numSlic: existingSlic.numSlic,
      action: 'deleted',
      changes: Object.entries(existingSlic)
        .filter(([field]) => !NOT_IN_DELETE_HISTORY.has(field))
        .map(([field, from]) => ({ field, from, to: null })),
      user,
    });

    return {
      success: true,
      deletedId: slicId,
      deletedSlic: existingSlic,
      message: `Slic "${
        existingSlic.alphaSlic || existingSlic.numSlic
      }" deleted successfully`,
    };
  } catch (error) {
    console.error('Error deleting slic:', error);
    throw error;
  }
}

export async function getAllSlics() {
  try {
    const db = client.db();
    const slicsCollection = db.collection('slics');
    const slics = await slicsCollection.find({}).sort({ numSlic: 1 }).toArray();

    return slics;
  } catch (error) {
    console.error('Error fetching slics:', error);
    throw error;
  }
}

// How many SLICs there are, and how many have a directions PDF (Blob, or the
// legacy Supabase flag), for the "What it takes" card on /about.
export async function countSlicsAndPdfs() {
  const slics = client.db().collection('slics');
  const [total, withPdf] = await Promise.all([
    slics.countDocuments(),
    slics.countDocuments({ $or: [{ pdfUrl: { $nin: [null, ''] } }, { pdf: true }] }),
  ]);
  return { total, withPdf };
}

// Stop codes on a job's route (lib/jobRoutes.js) → their SLICs, for the
// profile's This week card: a Map of stopKey → { numSlic, alpha }, only for
// the `keys` asked about. Every SLIC's alpha code is read (a few hundred) and
// folded the same way as the stops, since some are stored as numbers or in
// lower case. Two SLICs with one code keep the first.
export async function getSlicsByAlpha(keys) {
  const wanted = new Set(keys);
  const found = new Map();
  if (wanted.size === 0) return found;
  const slics = await client
    .db()
    .collection('slics')
    .find({}, { projection: { alphaSlic: 1, numSlic: 1 } })
    .toArray();
  for (const slic of slics) {
    const key = stopKey(slic.alphaSlic);
    if (wanted.has(key) && !found.has(key)) {
      found.set(key, { numSlic: String(slic.numSlic), alpha: String(slic.alphaSlic) });
    }
  }
  return found;
}

export async function getAllHubs() {
  try {
    const db = client.db();
    const allHubsCollection = db.collection('allHubs');
    const allHubs = await allHubsCollection.find({}).toArray();
    return allHubs;
  } catch (error) {
    console.error('Error fetching all hubs:', error);
    throw error;
  }
}

export async function getSlicById(slicId) {
  try {
    if (!slicId) {
      throw new HttpError(400, 'Slic ID is required');
    }

    if (!ObjectId.isValid(slicId)) {
      throw new HttpError(400, 'Invalid slic ID format');
    }

    const db = client.db();
    const slicsCollection = db.collection('slics');
    const slic = await slicsCollection.findOne({ _id: new ObjectId(slicId) });

    if (!slic) {
      throw new HttpError(404, `Slic with ID "${slicId}" not found`);
    }

    return slic;
  } catch (error) {
    console.error('Error fetching slic by ID:', error);
    throw error;
  }
}

export async function getSlicByNumSlic(slic) {
  const numSlic = slic;
  try {
    if (!numSlic) {
      throw new HttpError(400, 'numSlic is required');
    }

    const db = client.db();
    const slicsCollection = db.collection('slics');
    const slic = await slicsCollection.findOne({ numSlic });

    if (!slic) {
      throw new HttpError(404, `Slic with numSlic "${numSlic}" not found`);
    }

    return slic;
  } catch (error) {
    console.error('Error fetching slic by numSlic:', error);
    throw error;
  }
}

export async function setNumSlicsToString() {
  try {
    const db = client.db();
    const slicsCollection = db.collection('slics');

    const slics = await slicsCollection.find({}).toArray();

    for (const slic of slics) {
      if (typeof slic.numSlic === 'number') {
        await slicsCollection.updateOne(
          { _id: slic._id },
          { $set: { numSlic: String(slic.numSlic) } }
        );
      }
    }

    return { success: true, message: 'All numSlic values updated to strings' };
  } catch (error) {
    console.error('Error updating numSlic values:', error);
    throw error;
  }
}
