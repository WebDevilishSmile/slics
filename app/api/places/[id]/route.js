import { auth } from '@/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import {
  countOtherDriversComments,
  deletePlace,
  getPlaceById,
  updatePlace,
  validatePlace,
} from '@/lib/db/places';

// `[id]` is the place's MongoDB _id. Only the driver who added a place, or an
// admin, may edit or delete it.

function canManage(place, user) {
  return user.role === 'admin' || (!!place.createdBy && place.createdBy === user.id);
}

// PATCH (replace the editable fields of) a place
export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid place ID' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { place, error } = validatePlace(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const existing = await getPlaceById(id);
    if (!existing)
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    if (!canManage(existing, session.user))
      return NextResponse.json(
        { error: 'Only the driver who added this place can edit it.' },
        { status: 403 },
      );

    await updatePlace(id, place, session.user);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating place:', error);
    return NextResponse.json(
      { error: 'Could not save the place. Please try again.' },
      { status: 500 },
    );
  }
}

// DELETE a place and its comments. The driver who added it can only do this
// while nobody else has commented; after that it's an admin call.
export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid place ID' }, { status: 400 });
  }

  try {
    const existing = await getPlaceById(id);
    if (!existing)
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    if (!canManage(existing, session.user))
      return NextResponse.json(
        { error: 'Only the driver who added this place can delete it.' },
        { status: 403 },
      );

    if (session.user.role !== 'admin') {
      const others = await countOtherDriversComments(id, session.user.id);
      if (others > 0)
        return NextResponse.json(
          {
            error:
              'Other drivers have commented on this place, so only an admin can remove it. Leave a comment if something about it has changed.',
          },
          { status: 403 },
        );
    }

    await deletePlace(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting place:', error);
    return NextResponse.json(
      { error: 'Could not delete the place. Please try again.' },
      { status: 500 },
    );
  }
}
