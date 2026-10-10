import { requireUser } from '@/lib/authz';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  HISTORY_NOTE_MAX,
  setHistoryHidden,
  updateHistoryNote,
} from '@/lib/db/slicViews';

export const runtime = 'nodejs';

// Keyed by user id: one driver's edits never throttle another on the same wifi.
const EDIT_LIMIT = 60;
const EDIT_WINDOW_MS = 60 * 1000;

// PATCH one of the signed-in member's history rows. `[id]` is the slicViews
// _id. Body is `{ note }` (an empty string clears it) or `{ hidden }` (true
// removes the row from the History page; false is the Undo). The row stays in
// the collection either way, so the /home lookup counter is unaffected.
export async function PATCH(request, { params }) {
  const { session, denied } = await requireUser();
  if (denied) return denied;
  if (!session.user.bmcMember)
    return NextResponse.json(
      { error: 'History is available to members only.' },
      { status: 403 },
    );

  const { id } = await params;
  if (!id || !ObjectId.isValid(id))
    return NextResponse.json({ error: 'Invalid history entry.' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const hasNote = typeof body?.note === 'string';
  const hasHidden = typeof body?.hidden === 'boolean';
  if (hasNote === hasHidden)
    return NextResponse.json(
      { error: 'Send either a note or a hidden flag.' },
      { status: 400 },
    );
  if (hasNote && body.note.trim().length > HISTORY_NOTE_MAX)
    return NextResponse.json(
      { error: `Notes can be up to ${HISTORY_NOTE_MAX} characters.` },
      { status: 400 },
    );

  const rate = await checkRateLimit({
    key: `history-edit:${session.user.id}`,
    limit: EDIT_LIMIT,
    windowMs: EDIT_WINDOW_MS,
  });
  if (!rate.ok)
    return NextResponse.json(
      { error: 'Too many changes at once. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );

  try {
    const result = hasNote
      ? await updateHistoryNote(session.user.id, id, body.note)
      : await setHistoryHidden(session.user.id, id, body.hidden);
    if (!result)
      return NextResponse.json(
        { error: 'History entry not found.' },
        { status: 404 },
      );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating history entry:', error);
    return NextResponse.json(
      { error: 'Could not save that change. Please try again.' },
      { status: 500 },
    );
  }
}
