import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { setSlicReportStatus } from '@/lib/db/slicReports';

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
