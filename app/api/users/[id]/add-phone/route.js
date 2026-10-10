import { requireUser } from '@/lib/authz';
import clientPromise from '@/lib/db/client'; // Use clientPromise for consistency and safety
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function PATCH(req, { params }) {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  const { id: userId } = await params;

  if (!userId) {
    console.warn(
      'API PATCH /users/[id]/add-phone: Missing userId in parameters.',
    );
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    console.error(
      'API PATCH /users/[id]/add-phone: Error parsing request body:',
      error,
    );
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { phone, firstName, lastName } = requestBody;

  if (phone !== undefined && typeof phone !== 'string') {
    console.warn(
      `API PATCH /users/[id]/add-phone: Invalid phone format for userId: ${userId}`,
    );
    return NextResponse.json(
      { error: 'Invalid phone format (must be string or undefined/null)' },
      { status: 400 }
    );
  }

  // Names travel as a pair, same rule as registration: if either is sent,
  // both must be non-empty strings.
  const isUpdatingName = firstName !== undefined || lastName !== undefined;
  const isNonEmptyString = (value) =>
    typeof value === 'string' && value.trim().length > 0;

  if (
    isUpdatingName &&
    (!isNonEmptyString(firstName) || !isNonEmptyString(lastName))
  ) {
    console.warn(
      `API PATCH /users/[id]/add-phone: Invalid name for userId: ${userId}`,
    );
    return NextResponse.json(
      { error: 'First and last name are both required' },
      { status: 400 }
    );
  }

  const db = (await clientPromise).db(); // Correctly await clientPromise
  const usersCollection = db.collection('users');

  try {
    const filter = { _id: new ObjectId(userId) };
    const updateDoc = { $set: {} };

    if (phone !== undefined) {
      updateDoc.$set.phone = phone;
    }

    if (isUpdatingName) {
      const first = firstName.trim();
      const last = lastName.trim();
      updateDoc.$set.firstName = first;
      updateDoc.$set.lastName = last;
      // `name` is what the profile card, comment attribution and session
      // display, so keep it derived from the pair.
      updateDoc.$set.name = `${first} ${last}`;
    }

    if (Object.keys(updateDoc.$set).length === 0) {
      console.warn(
        `API PATCH /users/[id]/add-phone: No updatable fields provided for userId: ${userId}`,
      );
      return NextResponse.json(
        { error: 'No updatable fields provided (e.g., "phone" missing from body)' },
        { status: 400 }
      );
    }

    // The session's id and role are fresh (auth.js re-reads the user row on
    // every request), so there's no second lookup by email.
    const isAdmin = session.user.role === 'admin';
    const isUpdatingOwnProfile = session.user.id === userId;

    if (!isAdmin && !isUpdatingOwnProfile) {
      console.warn(
        `API PATCH /users/[id]/add-phone: Forbidden - user ${session.user.id} attempted to update user ${userId} without admin rights.`,
      );
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own profile unless you are an admin' },
        { status: 403 }
      );
    }

    const updatedUserResult = await usersCollection.findOneAndUpdate(
      filter,
      updateDoc,
      { returnDocument: 'after' }, // Return the document after the update
    );

    // CHANGE THIS BLOCK:
    // If updatedUserResult itself is null (e.g., if filter didn't match), then it's a 404.
    // If it's not null, it means a document was found and returned (it contains the updated document directly).
    if (!updatedUserResult) {
      // Check if findOneAndUpdate returned null
      console.error(
        `API PATCH /users/[id]/add-phone: findOneAndUpdate returned null result for userId: ${userId}.`,
      );
      return NextResponse.json(
        { error: 'User not found for update (ID may not exist or database issue).' },
        { status: 404 }
      );
    }

    // Now, updatedUserResult *is* the updated document.
    // Use it directly.
    console.log(
      `API PATCH /users/[id]/add-phone: Successfully updated user ${userId}. New data:`,
      updatedUserResult,
    );
    return NextResponse.json(updatedUserResult, { status: 200 }); // Return the document directly
  } catch (error) {
    console.error(`API Error: Error updating user ${userId}:`, error);
    if (error.name === 'BSONTypeError' || error.message.includes('ObjectId')) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
