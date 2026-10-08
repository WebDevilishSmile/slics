import { auth } from '@/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { deleteGym, updateGym, validateGym } from '@/lib/db/gyms';

// `[id]` is the gym's MongoDB _id. Admin-only, like every /api/gyms* route.

// PATCH (replace the editable fields of) a gym
export async function PATCH(request, { params }) {
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { gym, error } = validateGym(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const found = await updateGym(id, gym, session.user);
    if (!found)
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating gym:', error);
    return NextResponse.json(
      { error: 'Could not save the gym. Please try again.' },
      { status: 500 },
    );
  }
}

// DELETE a gym and its comments
export async function DELETE(request, { params }) {
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
    const found = await deleteGym(id);
    if (!found)
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gym:', error);
    return NextResponse.json(
      { error: 'Could not delete the gym. Please try again.' },
      { status: 500 },
    );
  }
}
