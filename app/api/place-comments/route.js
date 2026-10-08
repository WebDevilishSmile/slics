import { auth } from '@/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import {
  addPlaceComment,
  getPlaceThread,
  validatePlaceComment,
} from '@/lib/db/places';
import { checkRateLimit } from '@/lib/rateLimit';

// Same limit as SLIC comments (app/api/comment/route.js), keyed by user id.
const COMMENT_LIMIT = 10;
const COMMENT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// GET ?placeId= — the place's thread, shaped for the signed-in viewer.
export async function GET(request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const placeId = request.nextUrl.searchParams.get('placeId');
  if (!placeId || !ObjectId.isValid(placeId)) {
    return NextResponse.json({ error: 'Invalid place ID' }, { status: 400 });
  }

  try {
    const comments = await getPlaceThread(placeId, session.user.id);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching place comments:', error);
    return NextResponse.json(
      { error: 'Could not load comments. Please try again.' },
      { status: 500 },
    );
  }
}

// POST `{ placeId, parentId?, content }` — a comment, or a reply when
// `parentId` is set.
export async function POST(request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rate = await checkRateLimit({
    key: `place-comment:${session.user.id}`,
    limit: COMMENT_LIMIT,
    windowMs: COMMENT_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'You are posting too quickly. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body?.placeId || !ObjectId.isValid(body.placeId)) {
    return NextResponse.json({ error: 'Invalid place ID' }, { status: 400 });
  }
  if (body.parentId != null && !ObjectId.isValid(body.parentId)) {
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });
  }

  const { content, error } = validatePlaceComment(body.content);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const result = await addPlaceComment({
      placeId: body.placeId,
      parentId: body.parentId ?? null,
      content,
      user: session.user,
    });
    if (result.notFound === 'place')
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    if (result.notFound === 'parent')
      return NextResponse.json(
        { error: 'The comment you replied to no longer exists.' },
        { status: 404 },
      );
    return NextResponse.json({ _id: result.id }, { status: 201 });
  } catch (error) {
    console.error('Error adding place comment:', error);
    return NextResponse.json(
      { error: 'Could not post the comment. Please try again.' },
      { status: 500 },
    );
  }
}
