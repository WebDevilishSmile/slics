import { auth } from '@/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { addGymComment, validateGymComment } from '@/utils/gymsApi';

// POST a comment on a gym: `{ gymId, content }`. Admin-only, like every
// /api/gym-comments* route — the Planet Fitness page is the admin's own list.
export async function POST(request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin')
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 },
    );

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body?.gymId || !ObjectId.isValid(body.gymId)) {
    return NextResponse.json({ error: 'Invalid gym ID' }, { status: 400 });
  }

  const { content, error } = validateGymComment(body.content);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const _id = await addGymComment(body.gymId, content, session.user);
    if (!_id)
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
    return NextResponse.json({ _id }, { status: 201 });
  } catch (error) {
    console.error('Error adding gym comment:', error);
    return NextResponse.json(
      { error: 'Could not save the comment. Please try again.' },
      { status: 500 },
    );
  }
}
