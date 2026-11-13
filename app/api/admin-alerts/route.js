import { NextResponse } from 'next/server';
import { hasArea, requireStaff } from '@/lib/authz';
import { getOpenDisputeCount } from '@/lib/db/coverDisputes';
import { getOpenCoverReportSummary } from '@/lib/db/coverReports';
import { getUnseenCoverJobChanges } from '@/lib/db/coverJobChanges';
import { getPendingClaimCount } from '@/lib/db/driverClaims';
import { getUnseenJobChanges } from '@/lib/db/sheetJobs';
import { getOpenReportSummary } from '@/lib/db/slicReports';
import { getOpenRouteSuggestionSummary } from '@/lib/db/routeSuggestions';
import { getCoverChangesSeenAt, getJobChangesSeenAt } from '@/lib/db/users';

// Every count behind the staff header-menu badge, in one call
// (lib/adminAlertsStore.js): Jobs-tab and cover job changes this account
// hasn't seen, open SLIC reports, pending driver claims and open cover
// disputes, open cover reports, and open route suggestions (the SLICs
// area, docs/SLIC-DIRECTIONS.md). It was five calls on every route change. The five routes it reads
// like stay for the feeds and queues. Each count is read only for an area the
// caller has (docs/archive/STAFF-ROLES.md), and is 0 otherwise.
// 200 { success, data: { jobChanges, coverJobChanges, openReports,
// pendingClaims, openDisputes, openCoverReports, openRouteSuggestions } }.
export async function GET() {
  const { session, denied } = await requireStaff();
  if (denied) return denied;

  const none = { count: 0 };
  try {
    const userId = session.user.id;
    const claims = hasArea(session, 'driverClaims');
    const covers = hasArea(session, 'covers');
    const [jobChanges, coverJobChanges, reports, pendingClaims, openDisputes, coverReports, routeSuggestions] =
      await Promise.all([
      hasArea(session, 'jobs')
        ? getJobChangesSeenAt(userId).then((since) => getUnseenJobChanges(since))
        : none,
      covers
        ? getCoverChangesSeenAt(userId).then((since) => getUnseenCoverJobChanges(since))
        : none,
      hasArea(session, 'reports') ? getOpenReportSummary() : none,
      claims ? getPendingClaimCount() : 0,
      claims ? getOpenDisputeCount() : 0,
      covers ? getOpenCoverReportSummary() : none,
      hasArea(session, 'slics') ? getOpenRouteSuggestionSummary() : none,
    ]);
    return NextResponse.json({
      success: true,
      data: {
        jobChanges: jobChanges.count,
        coverJobChanges: coverJobChanges.count,
        openReports: reports.count,
        pendingClaims,
        openDisputes,
        openCoverReports: coverReports.count,
        openRouteSuggestions: routeSuggestions.count,
      },
    });
  } catch (error) {
    console.error('Error counting admin alerts:', error);
    return NextResponse.json({ error: "Couldn't load the admin alerts." }, { status: 500 });
  }
}
