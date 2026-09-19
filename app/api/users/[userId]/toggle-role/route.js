import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { auth } from '@/auth';
import client from '@/lib/db';

export const runtime = 'nodejs';

export async function PATCH(req, { params }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = client.db();
    const usersCollection = db.collection('users');
    const loggedInUser = await usersCollection.findOne({
      email: session.user.email,
    });

    if (!loggedInUser || loggedInUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let objectIdUserId;
    try {
      objectIdUserId = new ObjectId(userId);
    } catch (objIdError) {
      console.error(
        'API Error: Invalid User ID format for ObjectId:',
        objIdError
      );
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }

    const userToUpdate = await usersCollection.findOne({ _id: objectIdUserId });

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newRole = userToUpdate.role === 'admin' ? 'user' : 'admin';

    if (userToUpdate.role === newRole) {
      return NextResponse.json(
        {
          ...userToUpdate,
          message: `User role is already '${newRole}'. No change made.`,
        },
        { status: 200 }
      );
    }

    const updatedUserDocument = await usersCollection.findOneAndUpdate(
      // Renamed variable for clarity
      { _id: objectIdUserId },
      { $set: { role: newRole } },
      { returnDocument: 'after' }
    );

    // Fix: Directly check if updatedUserDocument is null/undefined
    // If it's null, it means no document was found matching the filter during the update
    if (!updatedUserDocument) {
      console.error(
        'API Error: findOneAndUpdate unexpectedly returned null, indicating no document matched filter during update.'
      );
      return NextResponse.json(
        { error: 'Failed to update user role. Document not found during update or disappeared.' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUserDocument, { status: 200 }); // Return the document directly
  } catch (error) {
    console.error('API Error: Uncaught error in PATCH /toggle-role:', error);
    console.error('API Error Stack:', error.stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
