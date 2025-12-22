import client from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function createDriver(driverData) {
  try {
    // Validate required fields
    const requiredFields = ['name', 'seniorityDate'];
    const missingFields = requiredFields.filter((field) => !driverData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const db = client.db();
    const driversCollection = db.collection('drivers');

    // Check if driver with same numSlic or alphaSlic already exists
    const existingDriver = await driversCollection.findOne({
      $or: [
        { employeeId: driverData.employeeId },
        { seniorityDate: driverData.seniorityDate },
      ],
    });

    if (existingDriver) {
      throw new Error(
        `Driver with employeeId "${driverData.employeeId}" or seniorityDate "${driverData.seniorityDate}" already exists`
      );
    }

    // Create the document
    const driverDocument = {
      created_at: new Date().toISOString(),
      seniorityDate: driverData.seniorityDate,
      employeeId: driverData.employeeId,
      name: driverData.name,
      phone: driverData.phone,
    };

    const result = await driversCollection.insertOne(driverDocument);

    return {
      _id: result.insertedId,
      ...driverDocument,
    };
  } catch (error) {
    console.error('Error creating driver:', error);
    throw error;
  }
}

export async function deleteDriver(driverId) {
  try {
    if (!driverId) {
      throw new Error('Driver ID is required');
    }

    if (!ObjectId.isValid(driverId)) {
      throw new Error('Invalid driver ID format');
    }

    const objectId = new ObjectId(driverId);
    const db = client.db();
    const driversCollection = db.collection('drivers');

    const existingDriver = await driversCollection.findOne({ _id: objectId });

    if (!existingDriver) {
      throw new Error(`Driver with ID "${driverId}" not found`);
    }

    const result = await driversCollection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      throw new Error('Failed to delete driver');
    }

    return {
      success: true,
      deletedId: driverId,
      deletedDriver: existingDriver,
      message: `Driver "${
        existingDriver.name || existingDriver.employeeId
      }" deleted successfully`,
    };
  } catch (error) {
    console.error('Error deleting driver:', error);
    throw error;
  }
}

export async function getAllDrivers() {
  try {
    const db = client.db('test');
    const driversCollection = db.collection('drivers');
    const drivers = await driversCollection
      .find({})
      .sort({ seniorityDate: 1 })
      .toArray();

    return drivers;
  } catch (error) {
    console.error('Error fetching drivers:', error);
    throw error;
  }
}

export async function getDriverById(driverId) {
  try {
    if (!driverId) {
      throw new Error('Driver ID is required');
    }

    if (!ObjectId.isValid(driverId)) {
      throw new Error('Invalid driver ID format');
    }

    const objectId = new ObjectId(driverId);
    const db = client.db();
    const driversCollection = db.collection('drivers');

    const driver = await driversCollection.findOne({ _id: objectId });

    if (!driver) {
      throw new Error(`Driver with ID "${driverId}" not found`);
    }

    return driver;
  } catch (error) {
    console.error('Error fetching driver by ID:', error);
    throw error;
  }
}
