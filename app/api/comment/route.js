import { auth } from '@/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import {
  createComment,
  deleteSlicComment,
  getCommentById,
  validateCommentPin,
  validateSlicComment,
} from '@/lib/db/comments';
import { checkRateLimit } from '@/lib/rateLimit';

// Keyed by user id, not IP — drivers share a building network, and one
// driver's spam must not silence everyone else on the same wifi.
const COMMENT_LIMIT = 10;
const COMMENT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// POST `{ numSlic, content, parentId?, pin? }` — a plain-text tip, or a reply
// when `parentId` is set (a reply to a reply joins the same thread). `pin` is
// an optional `{ lat, lng }`; with one, `content` may be empty.
export async function POST(request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rate = await checkRateLimit({
    key: `comment:${session.user.id}`,
    limit: COMMENT_LIMIT,
    windowMs: COMMENT_WINDOW_MS,
  });

  if (!rate.ok) {
    return NextResponse.json(
      { error: 'You are posting too quickly. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { numSlic, parentId } = body ?? {};
  if (!numSlic || typeof numSlic !== 'string')
    return NextResponse.json({ error: 'Slic ID is required' }, { status: 400 });
  if (parentId && !ObjectId.isValid(parentId))
    return NextResponse.json({ error: 'Invalid reply target.' }, { status: 400 });

  const { pin, error: pinError } = validateCommentPin(body.pin);
  if (pinError) return NextResponse.json({ error: pinError }, { status: 400 });
  const { content, error } = validateSlicComment(body.content, {
    allowEmpty: Boolean(pin),
  });
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const result = await createComment({
      numSlic,
      parentId: parentId || null,
      content,
      pin,
      userId: session.user.id,
    });
    if (result.notFound)
      return NextResponse.json(
        { error: 'That comment no longer exists.' },
        { status: 404 },
      );
    return NextResponse.json({ success: true, id: result.id.toString() });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Could not post your comment. Please try again.' },
      { status: 500 },
    );
  }
}

// DELETE `{ commentId }` — the profile and admin user pages' delete button.
// Same rules as DELETE /api/comments/[commentId].
export async function DELETE(request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { commentId } = await request.json();

    if (!commentId || !ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: 'A valid Comment ID is required' },
        { status: 400 }
      );
    }

    const comment = await getCommentById(commentId);
    if (!comment)
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    const isOwner = comment.userId?.toString() === session.user.id?.toString();
    const isAdmin = session.user.role === 'admin';
    if (!isOwner && !isAdmin)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const outcome = await deleteSlicComment(comment);
    return NextResponse.json({ success: true, outcome });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
