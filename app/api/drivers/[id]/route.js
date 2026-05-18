import client from '@/lib/db';
import { auth } from '@/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

  const { id } = await params;
  try {
    const updates = await request.json();

    // 1. Remove sensitive or immutable fields
    delete updates._id;

    const db = client.db();
    const result = await db
      .collection('drivers')
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE a driver
export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Invalid driver ID' }, { status: 400 });
  }

  try {
    const db = client.db();
    const result = await db
      .collection('drivers')
      .deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
