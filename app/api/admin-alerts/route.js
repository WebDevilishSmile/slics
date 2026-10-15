import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { getOpenDisputeCount } from '@/lib/db/coverDisputes';
import { getUnseenCoverJobChanges } from '@/lib/db/coverJobChanges';
import { getPendingClaimCount } from '@/lib/db/driverClaims';
import { getUnseenJobChanges } from '@/lib/db/sheetJobs';
import { getOpenReportSummary } from '@/lib/db/slicReports';
import { getCoverChangesSeenAt, getJobChangesSeenAt } from '@/lib/db/users';

// Every count behind the admin's header-menu badge, in one call
// (lib/adminAlertsStore.js): Jobs-tab and cover job changes this admin hasn't
// seen, open SLIC reports, pending driver claims and open cover disputes. It
// was five calls on every route change. The five routes it reads like stay
// for the feeds and queues.
// 200 { success, data: { jobChanges, coverJobChanges, openReports,
// pendingClaims, openDisputes } }.
export async function GET() {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const userId = session.user.id;
    const [jobChanges, coverJobChanges, reports, pendingClaims, openDisputes] = await Promise.all([
      getJobChangesSeenAt(userId).then((since) => getUnseenJobChanges(since)),
      getCoverChangesSeenAt(userId).then((since) => getUnseenCoverJobChanges(since)),
      getOpenReportSummary(),
      getPendingClaimCount(),
      getOpenDisputeCount(),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        jobChanges: jobChanges.count,
        coverJobChanges: coverJobChanges.count,
        openReports: reports.count,
        pendingClaims,
        openDisputes,
      },
    });
  } catch (error) {
    console.error('Error counting admin alerts:', error);
    return NextResponse.json({ error: "Couldn't load the admin alerts." }, { status: 500 });
  }
}
