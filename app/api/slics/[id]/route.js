import { requireAdmin, requireUser } from '@/lib/authz';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { deleteSlic, getSlicById, updateSlic } from '@/lib/db/slics';

// `[id]` is the slic's MongoDB _id for every method here and in ./pdf.

// GET a single slic
export async function GET(request, { params }) {
  const { denied } = await requireUser();
  if (denied) return denied;

  const { id } = await params;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });
  }

  try {
    const slic = await getSlicById(id);
    return NextResponse.json(slic);
  } catch (error) {
    console.error('Error fetching slic:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: 'Slic not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// PATCH (update) a slic
export async function PATCH(request, { params }) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });
  }

  try {
    const updates = await request.json();

    await updateSlic(id, updates, session.user);

    return NextResponse.json({ message: 'Slic updated successfully' });
  } catch (error) {
    console.error('Error updating slic:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error.message?.includes('numSlic cannot be changed')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE a slic
export async function DELETE(request, { params }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

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
