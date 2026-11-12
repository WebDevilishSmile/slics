import { after, NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import { checkRateLimit } from '@/lib/rateLimit';
import { notifyRouteSuggestion } from '@/lib/pushEvents';
import {
  createRouteSuggestion,
  getMyRouteSuggestion,
  validateRouteSuggestion,
} from '@/lib/db/routeSuggestions';

// Drivers suggest directions for a SLIC, or a change to them
// (docs/SLIC-DIRECTIONS.md, stage 2). Per driver, not per network: drivers
// share the building's wifi.
const SUGGESTION_LIMIT = 5;
const SUGGESTION_WINDOW_MS = 60 * 60 * 1000; // an hour

// POST `{ numSlic, text, note }`: any signed-in driver. Sending again while
// one is open for the SLIC replaces it.
export async function POST(request) {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `route-suggestion:${session.user.id}`,
    limit: SUGGESTION_LIMIT,
    windowMs: SUGGESTION_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You've sent a lot of suggestions. Please try again later." },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { suggestion, error } = validateRouteSuggestion(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const result = await createRouteSuggestion({ ...suggestion, userId: session.user.id });
    if (result.notFound) return NextResponse.json({ error: 'That SLIC no longer exists.' }, { status: 404 });
    if (!result.updated) {
      after(() => notifyRouteSuggestion({ numSlic: suggestion.numSlic, except: session.user.id }));
    }
    return NextResponse.json({ success: true, updated: Boolean(result.updated) });
  } catch (err) {
    console.error('Error saving a route suggestion:', err);
    return NextResponse.json({ error: "Couldn't send your suggestion. Please try again." }, { status: 500 });
  }
}

// GET ?slic= — the driver's own latest suggestion for the SLIC, and what
// became of it: `{ mine }`, null when they haven't sent one.
export async function GET(request) {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  const numSlic = request.nextUrl.searchParams.get('slic');
  if (!numSlic || !/^[A-Za-z0-9]{1,12}$/.test(numSlic)) {
    return NextResponse.json({ error: 'Which SLIC?' }, { status: 400 });
  }
  try {
    return NextResponse.json({ mine: await getMyRouteSuggestion(session.user.id, numSlic) });
  } catch (err) {
    console.error('Error loading a route suggestion:', err);
    return NextResponse.json({ error: "Couldn't load your suggestion." }, { status: 500 });
  }
}
