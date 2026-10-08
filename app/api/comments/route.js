import { auth } from '@/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import {
  createComment,
  getSlicThread,
  validateCommentPin,
  validateSlicComment,
} from '@/lib/db/comments';
import { getSlicByNumSlic } from '@/lib/db/slics';
import { checkRateLimit } from '@/lib/rateLimit';

// GET ?slic=<numSlic> — the SLIC's tips as a thread, shaped for the signed-in
// viewer (see getSlicThread). Responds `{ comments, slicName }`.
export async function GET(request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const numSlic = request.nextUrl.searchParams.get('slic');
  if (!numSlic)
    return NextResponse.json({ error: 'Slic ID is required' }, { status: 400 });

  try {
    const comments = await getSlicThread(numSlic, session.user.id);

    let slicName = null;
    try {
      const slic = await getSlicByNumSlic(numSlic);
      slicName = slic?.name || slic?.alphaSlic || null;
    } catch {
      // Slic may not exist (e.g. deleted) — comments can still be shown.
    }

    return NextResponse.json({ comments, slicName });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Could not load comments. Please try again.' },
      { status: 500 },
    );
  }
}

// Keyed by user id, not IP — drivers share a building network, and one
// driver's spam must not silence everyone else on the same wifi.
const COMMENT_LIMIT = 10;
const COMMENT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// POST `{ numSlic, content, parentId?, pin? }` — a plain-text tip, or a reply
// when `parentId` is set (a reply to a reply joins the same thread). `pin` is
// an optional `{ lat, lng }`; with one, `content` may be empty. Was
// /api/comment until 2026-10-08.
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
