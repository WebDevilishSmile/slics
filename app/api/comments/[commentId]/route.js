import { auth } from '@/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import {
  deleteSlicComment,
  getCommentById,
  updateCommentContent,
  validateSlicComment,
} from '@/utils/commentsApi';

// `[commentId]` is the comment's _id. Only its author, or an admin, may edit
// or delete it.
async function loadManageable(params, session) {
  const { commentId } = await params;
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

// PATCH `{ content }` — edit a comment. It's saved as plain text.
export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { content, error } = validateSlicComment(body?.content);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const { comment, response } = await loadManageable(params, session);
    if (response) return response;

    await updateCommentContent(comment._id.toString(), content);
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
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
