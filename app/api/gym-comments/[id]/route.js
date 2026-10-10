import { requireAdmin } from '@/lib/authz';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import {
  deleteGymComment,
  updateGymComment,
  validateGymComment,
} from '@/lib/db/gyms';

// `[id]` is the gym comment's MongoDB _id. Admin-only, like every
// /api/gym-comments* route.

// PATCH a comment's text: `{ content }`
export async function PATCH(request, { params }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { content, error } = validateGymComment(body?.content);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const found = await updateGymComment(id, content);
    if (!found)
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating gym comment:', error);
    return NextResponse.json(
      { error: 'Could not save the comment. Please try again.' },
      { status: 500 },
    );
  }
}

// DELETE a comment
export async function DELETE(request, { params }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
  }

  try {
    const found = await deleteGymComment(id);
    if (!found)
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gym comment:', error);
    return NextResponse.json(
      { error: 'Could not delete the comment. Please try again.' },
      { status: 500 },
    );
  }
}
