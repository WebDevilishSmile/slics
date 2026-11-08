import { NextResponse } from 'next/server';
import { requireArea } from '@/lib/authz';
import { recordAdminAction } from '@/lib/db/adminAudit';
import { deleteCoverReport, getCoverReportSummary, setCoverReportStatus } from '@/lib/db/coverReports';

// PATCH `{ status }`: 'resolved' (fixed, or checked and right), 'dismissed'
// (nothing to change) or 'open' (reopen). The Covers area.
export async function PATCH(request, { params }) {
  const { session, denied } = await requireArea('covers');
  if (denied) return denied;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const result = await setCoverReportStatus(id, body?.status, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, data: result.report });
  } catch (error) {
    console.error('Error updating a cover report:', error);
    return NextResponse.json({ error: "Couldn't update the report." }, { status: 500 });
  }
}

// DELETE a report for good (Delete on /admin/cover/reports), for test reports
// and ones filed by mistake. Written to `admin_audit` first
// (`coverReport.deleted`, `from` its week, job, kind and date; never the note
// or who filed it). The Covers area.
export async function DELETE(request, { params }) {
  const { session, denied } = await requireArea('covers');
  if (denied) return denied;

  const { id } = await params;
  try {
    const report = await getCoverReportSummary(id);
    if (!report) return NextResponse.json({ error: 'That report is already gone.' }, { status: 404 });

    await recordAdminAction({
      actor: session.user,
      action: 'coverReport.deleted',
      targetType: 'cover-report',
      targetId: report._id,
      targetName: null,
      from: report.text,
      to: null,
    });
    await deleteCoverReport(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting a cover report:', error);
    return NextResponse.json({ error: "Couldn't delete the report." }, { status: 500 });
  }
}
