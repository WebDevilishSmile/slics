import { requireUser } from '@/lib/authz';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { voteComment } from '@/lib/db/comments';

// POST `{ voteType: 'up' | 'down' | null }`. Up/down sets the driver's vote
// (moving it off the other side); null takes it back.
export async function POST(request, { params }) {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  const { id: commentId } = await params;
  if (!commentId || !ObjectId.isValid(commentId))
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });

  let voteType;
  try {
    ({ voteType } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (!['up', 'down', null].includes(voteType ?? null)) {
    return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
  }

  try {
    const found = await voteComment(commentId, voteType ?? null, session.user.id);
    if (!found)
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vote update error:', error);
    return NextResponse.json({ error: 'Could not save your vote.' }, { status: 500 });
  }
}
