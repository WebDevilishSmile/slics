import { getUserById } from '@/utils/usersApi';
import { NextResponse } from 'next/server';

export async function GET(_request, { params }) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json(
      { message: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
