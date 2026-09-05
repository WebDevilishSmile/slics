import { auth } from '@/auth';
import clientPromise from '@/lib/db'; // Use clientPromise for consistency and safety
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function PATCH(req, { params }) {
  const session = await auth();

  if (!session) {
    console.warn(
      'API PATCH /users/[userId]/add-phone: Unauthorized attempt - No session.'
    );
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await params;

  if (!userId) {
    console.warn(
      'API PATCH /users/[userId]/add-phone: Missing userId in parameters.'
    );
    return NextResponse.json(
      { message: 'User ID is required' },
      { status: 400 }
    );
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    console.error(
      'API PATCH /users/[userId]/add-phone: Error parsing request body:',
      error
    );
    return NextResponse.json(
      { message: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const { phone, name } = requestBody;

  if (phone !== undefined && typeof phone !== 'string') {
    console.warn(
      `API PATCH /users/[userId]/add-phone: Invalid phone format for userId: ${userId}`
    );
    return NextResponse.json(
      { message: 'Invalid phone format (must be string or undefined/null)' },
      { status: 400 }
    );
  }

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    console.warn(
      `API PATCH /users/[userId]/add-phone: Invalid name for userId: ${userId}`
    );
    return NextResponse.json(
      { message: 'Invalid name (must be a non-empty string)' },
      { status: 400 }
    );
  }

  const db = (await clientPromise).db(); // Correctly await clientPromise
  const usersCollection = db.collection('users');

  try {
    // --- Start Debugging Logs ---
    console.log(`\n--- Debugging PATCH /api/users/${userId}/add-phone ---`);
    console.log(`Received userId from params: "${userId}"`);
    console.log(`Received phone from body: "${phone}" (type: ${typeof phone})`);
    // --- End Debugging Logs ---

    const filter = { _id: new ObjectId(userId) };
    const updateDoc = { $set: {} };

    if (phone !== undefined) {
      updateDoc.$set.phone = phone;
    }

    if (name !== undefined) {
      updateDoc.$set.name = name.trim();
    }

    if (Object.keys(updateDoc.$set).length === 0) {
      console.warn(
        `API PATCH /users/[userId]/add-phone: No updatable fields provided for userId: ${userId}`
      );
      return NextResponse.json(
        {
          message:
            'No updatable fields provided (e.g., "phone" missing from body)',
        },
        { status: 400 }
      );
    }

    // Authorization Check (as per our previous conversation)
    const loggedInUserFromDb = await usersCollection.findOne({
      email: session.user.email,
    });

    if (!loggedInUserFromDb) {
      console.warn(
        `API PATCH /users/[userId]/add-phone: Logged-in user email (${session.user.email}) not found in DB for authorization.`
      );
      return NextResponse.json(
        { message: 'Forbidden: Your user account could not be verified' },
        { status: 403 }
      );
    }

    const isAdmin = loggedInUserFromDb.role === 'admin';
    const isUpdatingOwnProfile = loggedInUserFromDb._id.toString() === userId;

    if (!isAdmin && !isUpdatingOwnProfile) {
      console.warn(
        `API PATCH /users/[userId]/add-phone: Forbidden - User ${loggedInUserFromDb.email} (ID: ${loggedInUserFromDb._id}) attempted to update user ${userId} without admin rights.`
      );
      return NextResponse.json(
        {
          message:
            'Forbidden: You can only update your own profile unless you are an admin',
        },
        { status: 403 }
      );
    }

    const updatedUserResult = await usersCollection.findOneAndUpdate(
      filter,
      updateDoc,
      { returnDocument: 'after' } // Return the document after the update
    );

    // --- Post-Update Debugging Logs ---
    console.log('findOneAndUpdate Raw Result Object:', updatedUserResult); // Log the full object
    // --- End Post-Update Debugging Logs ---

    // CHANGE THIS BLOCK:
    // If updatedUserResult itself is null (e.g., if filter didn't match), then it's a 404.
    // If it's not null, it means a document was found and returned (it contains the updated document directly).
    if (!updatedUserResult) {
      // Check if findOneAndUpdate returned null
      console.error(
        `API PATCH /users/[userId]/add-phone: findOneAndUpdate returned null result for userId: ${userId}.`
      );
      return NextResponse.json(
        {
          message:
            'User not found for update (ID may not exist or database issue).',
        },
        { status: 404 }
      );
    }

    // Now, updatedUserResult *is* the updated document.
    // Use it directly.
    console.log(
      `API PATCH /users/[userId]/add-phone: Successfully updated user ${userId}. New data:`,
      updatedUserResult
    );
    return NextResponse.json(updatedUserResult, { status: 200 }); // Return the document directly
  } catch (error) {
    console.error(`API Error: Error updating user ${userId}:`, error);
    if (error.name === 'BSONTypeError' || error.message.includes('ObjectId')) {
      return NextResponse.json(
        { message: 'Invalid User ID format' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
