import { NextResponse } from 'next/server';
import { secretsMatch } from '@/lib/secretsMatch';
import { runCoverNotifications } from '@/lib/coverNotices';

export const runtime = 'nodejs';
export const maxDuration = 60;

// The Covers notifications that come from the clock (docs/PUSH-NOTIFICATIONS.md,
// stage 3; lib/coverNotices.js): call-in reminders on bid day every minute,
// and every fifth minute the call-in and cover-jobs notices once a week's
// sheet has gone quiet. Vercel Cron calls it every minute (vercel.json), which
// needs the Pro plan; a Hobby cron runs once a day. Every run is safe to
// repeat: what's been sent is recorded first (`cover-notices`).
//
// Vercel sends `Authorization: Bearer ${CRON_SECRET}` on its own once
// CRON_SECRET is set on the project. `?all=1` runs every part now, for a
// manual check (`vercel crons run`, or curl with the header).
// 200 done (each part's counts, or `error: true` for a part that failed) ·
// 401 no or wrong token · 500 no CRON_SECRET.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('CRON_SECRET is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  const header = request.headers.get('authorization') ?? '';
  if (!secretsMatch(header, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const all = new URL(request.url).searchParams.get('all') === '1';
  const results = await runCoverNotifications(new Date(), { all });
  return NextResponse.json({ success: true, data: results });
}
