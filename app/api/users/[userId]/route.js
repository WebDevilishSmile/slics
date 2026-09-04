import { auth } from '@/auth';
import { getPublicUserById } from '@/utils/usersApi';
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
