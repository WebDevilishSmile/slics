import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { createPlace, validatePlace } from '@/lib/db/places';
import { checkRateLimit } from '@/lib/rateLimit';

// Any signed-in driver can add a place (Whip It In & Out). Keyed by user id,
// not IP — drivers share a building network (see app/api/comment/route.js).
const PLACE_LIMIT = 10;
const PLACE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// POST a new place
export async function POST(request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rate = await checkRateLimit({
    key: `place:${session.user.id}`,
    limit: PLACE_LIMIT,
    windowMs: PLACE_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You've added a lot of places in a short time. Try again later." },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { place, error } = validatePlace(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const _id = await createPlace(place, session.user);
    return NextResponse.json({ _id }, { status: 201 });
  } catch (error) {
    console.error('Error creating place:', error);
    return NextResponse.json(
      { error: 'Could not save the place. Please try again.' },
      { status: 500 },
    );
  }
}
