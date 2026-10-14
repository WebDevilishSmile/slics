import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { recordAdminAction } from '@/lib/db/adminAudit';
import { deleteSlicReport, getSlicReportSummary, setSlicReportStatus } from '@/lib/db/slicReports';

// PATCH `{ status }`: 'resolved' (the edit form saved a fix), 'dismissed'
// (nothing to change) or 'open' (reopen). Admin only.
export async function PATCH(request, { params }) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const result = await setSlicReportStatus(id, body?.status, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, data: result.report });
  } catch (error) {
    console.error('Error updating a SLIC report:', error);
    return NextResponse.json({ error: "Couldn't update the report." }, { status: 500 });
  }
}

// DELETE a report for good (Delete on /admin/reports), for test reports and
// ones filed by mistake. Written to `admin_audit` first (`report.deleted`,
// `from` its SLIC, kind and date; never the note or who filed it). Admin only.
export async function DELETE(request, { params }) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const report = await getSlicReportSummary(id);
    if (!report) return NextResponse.json({ error: 'That report is already gone.' }, { status: 404 });

    await recordAdminAction({
      actor: session.user,
      action: 'report.deleted',
      targetType: 'slic-report',
      targetId: report._id,
      targetName: null,
      from: report.text,
      to: null,
    });
    await deleteSlicReport(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting a SLIC report:', error);
    return NextResponse.json({ error: "Couldn't delete the report." }, { status: 500 });
  }
}
