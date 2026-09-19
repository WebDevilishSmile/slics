import { auth } from '@/auth';
import { getCommentVoters } from '@/utils/commentsApi';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// Who upvoted / downvoted a comment. Members-only (or admin) — the response
// names other drivers, and viewing that is a membership perk.
export async function GET(_request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!session.user.bmcMember && session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { commentId } = await params;

  if (!commentId || !ObjectId.isValid(commentId))
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });

  try {
    const voters = await getCommentVoters(commentId);

    if (!voters)
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    return NextResponse.json(voters);
  } catch (error) {
    console.error('Error fetching comment voters:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
