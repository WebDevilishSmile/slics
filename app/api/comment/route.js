import client from '@/lib/db';
import { auth } from '@/auth';
import { createComment } from '@/utils/commentsApi';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/utils/rateLimit';

// Keyed by user id, not IP — drivers share a building network, and one
// driver's spam must not silence everyone else on the same wifi.
const COMMENT_LIMIT = 10;
const COMMENT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

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

  try {
    const { numSlic, content } = await request.json();

    if (!numSlic || !content) {
      return NextResponse.json(
        { error: 'Slic ID and content are required' },
        { status: 400 }
      );
    }

    const commentData = {
      userId: session.user.id,
      numSlic,
      content,
      created_at: new Date().toISOString(),
    };

    const result = await createComment(commentData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

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

    const db = client.db();
    const comment = await db.collection('comments').findOne({ _id: new ObjectId(commentId) });

    if (!comment)
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    const isOwner = comment.userId?.toString() === session.user.id?.toString();
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const result = await db.collection('comments').deleteOne({ _id: new ObjectId(commentId) });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
