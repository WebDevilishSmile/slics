import { requireUser } from '@/lib/authz';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { votePlaceComment } from '@/lib/db/places';

// POST `{ voteType: 'up' | 'down' | null }` — any signed-in driver, one vote
// per comment; voting the other way moves it, null takes it back.
export async function POST(request, { params }) {
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
  const voteType = body?.voteType ?? null;
  if (!['up', 'down', null].includes(voteType)) {
    return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
  }

  try {
    const found = await votePlaceComment(id, voteType, session.user.id);
    if (!found)
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error voting on place comment:', error);
    return NextResponse.json(
      { error: 'Could not save your vote. Please try again.' },
      { status: 500 },
    );
  }
}
