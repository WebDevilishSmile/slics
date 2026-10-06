import { auth } from '@/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { markGymVisited } from '@/utils/gymsApi';

// POST — stamp the gym's lastVisited with the server's current time.
// Admin-only, like every /api/gyms* route.
export async function POST(request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin')
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 },
    );

  const { id } = await params;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid gym ID' }, { status: 400 });
  }

  try {
    const found = await markGymVisited(id);
    if (!found)
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking gym visited:', error);
    return NextResponse.json(
      { error: 'Could not mark the gym visited. Please try again.' },
      { status: 500 },
    );
  }
}
