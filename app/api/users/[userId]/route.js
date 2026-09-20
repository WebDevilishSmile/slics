import { auth } from '@/auth';
import {
  deleteUserAccount,
  getPublicUserById,
  getUserById,
} from '@/utils/usersApi';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// Returns the minimal author profile used to attribute comments.
// Signed-in only, and projected to { _id, name, image } — never the full
// user document, which holds the password hash and email.
export async function GET(_request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const user = await getPublicUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Self-service account deletion. Only the signed-in user can delete their own
// account, admins are refused (so the last admin can't remove themselves), and
// the body must echo the typed confirmation so a stray DELETE can't wipe an
// account. The caller signs out afterwards; the JWT itself is not touched here.
export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;

  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  if (session.user.id !== userId) {
    return NextResponse.json(
      { error: 'You can only delete your own account' },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  if (body?.confirm !== 'DELETE') {
    return NextResponse.json(
      { error: 'Confirmation required' },
      { status: 400 }
    );
  }

  try {
    // Re-read the role from the database rather than trusting the token for
    // an irreversible action.
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: "Admin accounts can't be deleted from the profile page" },
        { status: 403 }
      );
    }

    const result = await deleteUserAccount(userId);
    console.log(`Deleted account ${userId}:`, result);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting account ${userId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
