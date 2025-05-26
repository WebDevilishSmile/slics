import client from '@/lib/db';

export async function createSlic(slicData) {
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
      created_at: slicData.created_at || new Date().toISOString(),
      type: slicData.type,
      numSlic: slicData.numSlic,
      alphaSlic: slicData.alphaSlic,
      name: slicData.name,
      phone: slicData.phone,
      address: {
        street: slicData.address.street,
        city: slicData.address.city,
        zip: slicData.address.zip,
      },
      directions: slicData.directions || null,
    };

    const result = await slicsCollection.insertOne(slicDocument);

    return {
      _id: result.insertedId,
      ...slicDocument,
    };
  } catch (error) {
    console.error('Error creating slic:', error);
    throw error;
  }
}

export async function getAllSlics() {
  try {
    const db = client.db('test');
    const slicsCollection = db.collection('slics');
    const slics = await slicsCollection.find({}).toArray();

    return slics;
  } catch (error) {
    console.error('Error fetching slics:', error);
    throw error;
  }
}
