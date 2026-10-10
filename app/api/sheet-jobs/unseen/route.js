import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { getUnseenJobChanges } from '@/lib/db/sheetJobs';
import { getJobChangesSeenAt } from '@/lib/db/users';

// Jobs-tab changes the signed-in admin hasn't seen yet, for the menu badge
// (lib/jobChangesStore.js): { count, jobs, latest }. Reads MongoDB only.
export async function GET() {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const since = await getJobChangesSeenAt(session.user.id);
    const data = await getUnseenJobChanges(since);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error counting unseen job changes:', error);
    return NextResponse.json({ error: "Couldn't load the job changes." }, { status: 500 });
  }
}
