// src/app/api/users/[id]/toggle-membership/route.js
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { auth } from '@/auth'; // Import your auth helper for server-side session access
import client from '@/lib/db';

export const runtime = 'nodejs'; // Ensure this runs on Node.js environment

export async function PATCH(req, { params }) {
  // Use PATCH for updating a partial resource
  const session = await auth(); // Get the server-side session

  // 1. Authentication Check (Is the user logged in?)
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Authorization Check (Is the user an admin?)
  // Fetch user role from DB for definitive check (more robust than session.user.role for admin actions)
  const db = client.db();
  const usersCollection = db.collection('users');
  const loggedInUser = await usersCollection.findOne({
    email: session.user.email,
  });

  if (!loggedInUser || loggedInUser.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  // Extract userId from the URL path (e.g., /api/users/123/toggle-membership)
  const { userId } = await params;

  console.log('Toggling membership for userId:', userId);

  if (!userId) {
    return NextResponse.json(
      { message: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    const userToUpdate = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!userToUpdate) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Determine the new value for bmcMember.
    // If bmcMember is undefined or null, !userToUpdate.bmcMember will evaluate to true.
    const newBmcMemberStatus = !userToUpdate.bmcMember;

    const updatedUser = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { bmcMember: newBmcMemberStatus } },
      { returnDocument: 'after' } // Return the document after the update
    );

    if (!updatedUser.value) {
      return NextResponse.json(
        { message: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Return the updated user object (or a subset of it)
    return NextResponse.json(updatedUser.value, { status: 200 });
  } catch (error) {
    console.error('API Error: Error toggling membership:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
