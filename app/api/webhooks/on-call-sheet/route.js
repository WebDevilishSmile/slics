import { NextResponse } from 'next/server';
import { secretMatchesHash, secretsMatch } from '@/lib/secretsMatch';
import { getHubConfig } from '@/lib/db/hubConfigs';
import { checkRateLimit } from '@/lib/rateLimit';
import { recordSheetPing } from '@/lib/db/syncState';
import { syncFromSheet } from '@/lib/onCallSheetSync';

export const runtime = 'nodejs';
// A ping with no tab re-reads Jobs plus every current week.
export const maxDuration = 60;

// The sheet's notifier pings this when the ON CALL SHEET changes
// (docs/guides/on-call-sheet-apps-script.md, docs/ON-CALL-SHEET-SYNC.md stage 3).
//
// Header: x-sheet-secret, the script's APP_SECRET. It's checked against the
// hub's stored hash (`hub-configs` `sheet.webhookSecretHash`) when there is
// one, else ON_CALL_SHEET_WEBHOOK_SECRET as before (docs/MULTI-HUB.md). Only
// BETPA's sheet pings until stage 2 names the hub.
// Body: { tab } for an edit, { changeType } for added or removed rows, columns
// or tabs. It's only a hint about what to re-read (syncFromSheet).
// 200 done · 202 every part was already being read, and will be read once more
// · 401 no secret · 403 wrong secret · 429 too many pings · 502 Google failed.
export async function POST(request) {
  const { sheet } = await getHubConfig();
  if (!sheet.webhookSecretHash && !sheet.webhookSecret) {
    console.error('ON_CALL_SHEET_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  const secret = request.headers.get('x-sheet-secret');
  if (!secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const matches = sheet.webhookSecretHash
    ? secretMatchesHash(secret, sheet.webhookSecretHash)
    : secretsMatch(secret, sheet.webhookSecret);
  if (!matches) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const limit = await checkRateLimit({ key: 'sheet-webhook', limit: 120, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many pings. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const hint = {};
  if (typeof body?.tab === 'string') hint.tab = body.tab.slice(0, 100);
  if (typeof body?.changeType === 'string') hint.changeType = body.changeType.slice(0, 40);

  try {
    await recordSheetPing(hint);
  } catch (error) {
    console.error('Error recording the on-call sheet ping:', error);
  }

  // testPing in the script: proves the secret and the URL, reads nothing.
  if (hint.changeType === 'TEST' && hint.tab === undefined) {
    return NextResponse.json({ success: true, data: { results: [] } });
  }

  try {
    const { results } = await syncFromSheet(hint, { source: 'ping' });
    const allQueued = results.length > 0 && results.every((result) => result.status === 'queued');
    return NextResponse.json({ success: true, data: { results } }, { status: allQueued ? 202 : 200 });
  } catch (error) {
    console.error('Error syncing from an on-call sheet ping:', error);
    return NextResponse.json({ error: "Couldn't read the sheet." }, { status: 502 });
  }
}
