import client from '@/lib/db';
import { ObjectId } from 'mongodb';
import { addSlicHistoryEntry, diffSlicFields } from '@/utils/slicHistoryApi';

function toUserStamp(user) {
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
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate address structure
    if (
      !slicData.address.street ||
      !slicData.address.city ||
      !slicData.address.state ||
      !slicData.address.zip
    ) {
      throw new Error('Address must include street, city, and zip');
    }

    const db = client.db();
    const slicsCollection = db.collection('slics');

    // Check if slic with same numSlic or alphaSlic already exists
    const existingSlic = await slicsCollection.findOne({
      $or: [{ numSlic: slicData.numSlic }, { alphaSlic: slicData.alphaSlic }],
    });

    if (existingSlic) {
      throw new Error(
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
      // Set by the admin upload route (app/api/slic/[id]/pdf) after creation
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

export async function updateSlic(numSlic, updates, user) {
  try {
    if (!numSlic) {
      throw new Error('numSlic is required');
    }

    const db = client.db();
    const slicsCollection = db.collection('slics');

    const existingSlic = await slicsCollection.findOne({ numSlic });

    if (!existingSlic) {
      throw new Error(`Slic with numSlic "${numSlic}" not found`);
    }

    const changes = diffSlicFields(existingSlic, updates);

    const updatedFields = {
      ...updates,
      updated_at: new Date().toISOString(),
      updatedBy: toUserStamp(user),
    };

    const result = await slicsCollection.updateOne(
      { numSlic },
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

    return result;
  } catch (error) {
    console.error('Error updating slic:', error);
    throw error;
  }
}

export async function deleteSlic(slicId) {
  try {
    if (!slicId) {
      throw new Error('Slic ID is required');
    }

    if (!ObjectId.isValid(slicId)) {
      throw new Error('Invalid slic ID format');
    }

    const objectId = new ObjectId(slicId);
    const db = client.db();
    const slicsCollection = db.collection('slics');

    const existingSlic = await slicsCollection.findOne({ _id: objectId });

    if (!existingSlic) {
      throw new Error(`Slic with ID "${slicId}" not found`);
    }

    const result = await slicsCollection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      throw new Error('Failed to delete slic');
    }

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

export async function getSlicByNumSlic(slic) {
  const numSlic = slic;
  try {
    if (!numSlic) {
      throw new Error('numSlic is required');
    }

    const db = client.db();
    const slicsCollection = db.collection('slics');
    const slic = await slicsCollection.findOne({ numSlic });

    if (!slic) {
      throw new Error(`Slic with numSlic "${numSlic}" not found`);
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
