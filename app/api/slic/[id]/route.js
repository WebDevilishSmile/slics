import client from '@/lib/db';

import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { deleteSlic } from '@/utils/slicsApi';

// GET a single slic
export async function GET(request, { params }) {
  const { id } = params;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });
  }

  try {
    const db = client.db();
    const slic = await db
      .collection('slics')
      .findOne({ _id: new ObjectId(id) });

    if (!slic) {
      return NextResponse.json({ error: 'Slic not found' }, { status: 404 });
    }

    return NextResponse.json(slic);
  } catch (error) {
    console.error('Error fetching slic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH (update) a slic
export async function PATCH(request, { params }) {
  const { id } = params;
  console.log(id);

  if (!id) {
    return NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });
  }

  try {
    const updates = await request.json();
    const db = client.db();

    const result = await db
      .collection('slics')
      .updateOne({ numSlic: id }, { $set: updates });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Slic not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Slic updated successfully' });
  } catch (error) {
    console.error('Error updating slic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a slic
export async function DELETE(request, { params }) {
  const { id } = params;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });
  }

  try {
    const result = await deleteSlic(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting slic:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
