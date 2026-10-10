import { requireUser } from '@/lib/authz';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import {
  deletePlaceComment,
  getPlaceCommentById,
  updatePlaceComment,
  validatePlaceComment,
} from '@/lib/db/places';

// `[id]` is the place comment's MongoDB _id. Only its author or an admin may
// edit or delete it.

function canManage(comment, user) {
  return user.role === 'admin' || (!!comment.userId && comment.userId === user.id);
}

// PATCH a comment's text: `{ content }`
export async function PATCH(request, { params }) {
  const { session, denied } = await requireUser();
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

  const { content, error } = validatePlaceComment(body?.content);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const comment = await getPlaceCommentById(id);
    if (!comment)
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    if (!canManage(comment, session.user))
      return NextResponse.json(
        { error: 'You can only edit your own comments.' },
        { status: 403 },
      );

    await updatePlaceComment(id, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating place comment:', error);
    return NextResponse.json(
      { error: 'Could not save the comment. Please try again.' },
      { status: 500 },
    );
  }
}

// DELETE a comment (a "Comment deleted" placeholder if it still has replies)
export async function DELETE(request, { params }) {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  const { id } = await params;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
  }

  try {
    const comment = await getPlaceCommentById(id);
    if (!comment)
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    if (!canManage(comment, session.user))
      return NextResponse.json(
        { error: 'You can only delete your own comments.' },
        { status: 403 },
      );

    await deletePlaceComment(comment);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting place comment:', error);
    return NextResponse.json(
      { error: 'Could not delete the comment. Please try again.' },
      { status: 500 },
    );
  }
}
