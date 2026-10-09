import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { refreshJobsTab } from '@/lib/onCallSheetSync';

const STATUS = { 'no-tab': 404, format: 422 };

// Pulls the on-call sheet's Jobs tab and records what changed
// (refreshJobsTab, docs/ON-CALL-SHEET-SYNC.md stage 2). The first refresh is a
// baseline and records no changes.
export async function POST() {
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

  try {
    const result = await refreshJobsTab({ source: 'refresh' });
    if (result.status !== 'ok') {
      return NextResponse.json({ error: result.message }, { status: STATUS[result.status] });
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error refreshing the jobs tab from the on-call sheet:', error);
    return NextResponse.json(
      { error: "Couldn't read the sheet or save the jobs. Try again in a minute." },
      { status: 502 }
    );
  }
}
