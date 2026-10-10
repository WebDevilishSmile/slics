import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { markJobChangesSeen } from '@/lib/db/users';

// Exactly what toISOString() writes, which is how every change's seenAt is stored.
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

// Marks the signed-in admin's Jobs-tab changes seen up to `upTo`: the seenAt of
// the newest change /admin/jobs rendered, not "now", so a change that arrives
// while the page is open isn't cleared unseen. Body: { upTo: ISO string }.
export async function POST(request) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const upTo = body?.upTo;
  if (typeof upTo !== 'string' || !ISO.test(upTo) || Number.isNaN(Date.parse(upTo))) {
    return NextResponse.json({ error: 'upTo must be an ISO date-time' }, { status: 400 });
  }
  if (Date.parse(upTo) > Date.now() + 60_000) {
    return NextResponse.json({ error: 'upTo is in the future' }, { status: 400 });
  }

  try {
    await markJobChangesSeen(session.user.id, upTo);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking job changes seen:', error);
    return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  }
}
