import { requireUser } from '@/lib/authz';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import {
  deleteSlicComment,
  getCommentById,
  updateCommentContent,
  validateCommentPin,
  validateSlicComment,
} from '@/lib/db/comments';

// `[id]` is the comment's _id. Only its author, or an admin, may edit
// or delete it.
async function loadManageable(params, session) {
  const { id: commentId } = await params;
  if (!commentId || !ObjectId.isValid(commentId))
    return { response: NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 }) };

  const comment = await getCommentById(commentId);
  if (!comment)
    return { response: NextResponse.json({ error: 'Comment not found' }, { status: 404 }) };

  const isOwner = comment.userId?.toString() === session.user.id?.toString();
  if (!isOwner && session.user.role !== 'admin')
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };

  return { comment };
}

// PATCH `{ content, pin? }` — edit a comment. It's saved as plain text. `pin`
// `{ lat, lng }` sets the pin, null removes it, leaving it out keeps it. The
// text may be empty while the comment keeps a pin.
export async function PATCH(request, { params }) {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { pin, error: pinError } = validateCommentPin(body?.pin);
  if (pinError) return NextResponse.json({ error: pinError }, { status: 400 });

  try {
    const { comment, response } = await loadManageable(params, session);
    if (response) return response;

    const keepsPin = pin === undefined ? Boolean(comment.pin) : Boolean(pin);
    const { content, error } = validateSlicComment(body?.content, {
      allowEmpty: keepsPin,
    });
    if (error) return NextResponse.json({ error }, { status: 400 });

    await updateCommentContent(comment._id.toString(), content, pin);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error editing comment:', err);
    return NextResponse.json(
      { error: 'Could not save your edit. Please try again.' },
      { status: 500 },
    );
  }
}

// DELETE — a top-level comment with replies becomes a "Comment deleted"
// placeholder; anything else is removed.
export async function DELETE(_request, { params }) {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  try {
    const { comment, response } = await loadManageable(params, session);
    if (response) return response;

    const outcome = await deleteSlicComment(comment);
    return NextResponse.json({ message: 'Comment deleted successfully', outcome });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
