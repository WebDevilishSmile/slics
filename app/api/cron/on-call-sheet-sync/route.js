import { NextResponse } from 'next/server';
import { secretsMatch } from '@/lib/secretsMatch';
import { syncFromSheet } from '@/lib/onCallSheetSync';

export const runtime = 'nodejs';
// Reads Jobs plus every current week.
export const maxDuration = 60;

// The daily backstop (docs/ON-CALL-SHEET-SYNC.md, stage 3): Vercel Cron calls
// this once a day (vercel.json) and it does the same full re-read as a ping
// with no tab. It catches what the sheet's notifier misses: a lost ping, a day
// the script is off, or edits made by other scripts, which fire no trigger.
//
// Vercel sends `Authorization: Bearer ${CRON_SECRET}` on its own once
// CRON_SECRET is set on the project.
// 200 done · 401 no or wrong token · 502 Google failed.
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

  try {
    const { results } = await syncFromSheet({}, { source: 'cron' });
    const failed = results.filter((result) => result.status === 'error');
    if (failed.length) {
      console.error('On-call sheet cron sync had errors:', failed);
    }
    return NextResponse.json({ success: true, data: { results } });
  } catch (error) {
    console.error('Error in the on-call sheet cron sync:', error);
    return NextResponse.json({ error: "Couldn't read the sheet." }, { status: 502 });
  }
}
