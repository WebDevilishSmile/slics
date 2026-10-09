import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { isSaturday } from '@/lib/onCallSheet';
import { refreshCoverWeek } from '@/lib/onCallSheetSync';

// The status each refreshCoverWeek outcome answers with.
const STATUS = { 'no-tab': 404, uploaded: 409, format: 422 };

// Pulls one week's cover tab from the "ON CALL SHEET" and saves its jobs and
// picks (refreshCoverWeek, docs/ON-CALL-SHEET-SYNC.md).
//
// Body: { weekEnding: 'YYYY-MM-DD' (a Saturday), replaceUploaded?: boolean }
// 404 no tab for that week · 409 the week has uploaded jobs and replaceUploaded
// isn't set (the message is the question to ask) · 422 the tab isn't laid out
// as expected · 502 Google couldn't be read.
export async function POST(request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const limit = await checkRateLimit({
    key: `sheet-refresh:${session.user.id}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many refreshes. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { weekEnding, replaceUploaded = false } = body ?? {};
  if (!isSaturday(weekEnding)) {
    return NextResponse.json(
      { error: 'weekEnding must be a Saturday as YYYY-MM-DD' },
      { status: 400 }
    );
  }

  try {
    const result = await refreshCoverWeek({
      weekEnding,
      replaceUploaded: Boolean(replaceUploaded),
      user: session.user,
    });
    if (result.status !== 'ok') {
      return NextResponse.json({ error: result.message }, { status: STATUS[result.status] });
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error refreshing a cover week from the on-call sheet:', error);
    return NextResponse.json(
      { error: "Couldn't read the sheet or save the week. Try again in a minute." },
      { status: 502 }
    );
  }
}
