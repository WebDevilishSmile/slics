import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { getUnseenCoverJobChanges } from '@/lib/db/coverJobChanges';
import { getCoverChangesSeenAt } from '@/lib/db/users';

// Cover-tab changes the signed-in admin hasn't seen yet, for the menu badge
// (lib/coverJobChangesStore.js): { count, latest, week }. Reads MongoDB only.
export async function GET() {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const since = await getCoverChangesSeenAt(session.user.id);
    const data = await getUnseenCoverJobChanges(since);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error counting unseen cover job changes:', error);
    return NextResponse.json({ error: "Couldn't load the cover job changes." }, { status: 500 });
  }
}
