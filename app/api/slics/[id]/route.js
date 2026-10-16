import { requireArea, requireUser } from '@/lib/authz';
import { ObjectId } from 'mongodb';
import { after, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/httpError';
import { deleteSlic, getSlicById, updateSlic } from '@/lib/db/slics';
import { notifySlicEdit } from '@/lib/pushEvents';

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
  const { session, denied } = await requireArea('slics');
  if (denied) return denied;

  const { id } = await params;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });
  }

  try {
    const updates = await request.json();

    const { numSlic, changed } = await updateSlic(id, updates, session.user);
    // A push to the other admins who chose SLIC edits, when anything changed.
    if (changed) {
      after(() => notifySlicEdit({ numSlic, action: 'updated', except: session.user.id }));
    }

    return NextResponse.json({ message: 'Slic updated successfully' });
  } catch (error) {
    console.error('Error updating slic:', error);
    return errorResponse(error, "Couldn't save the SLIC. Please try again.");
  }
}

// DELETE a slic
export async function DELETE(request, { params }) {
  const { session, denied } = await requireArea('slics');
  if (denied) return denied;

  const { id } = await params;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });
  }

  try {
    const result = await deleteSlic(id);
    const numSlic = result.deletedSlic?.numSlic;
    if (numSlic) {
      after(() => notifySlicEdit({ numSlic, action: 'deleted', except: session.user.id }));
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting slic:', error);
    return errorResponse(error, "Couldn't delete the SLIC. Please try again.");
  }
}
