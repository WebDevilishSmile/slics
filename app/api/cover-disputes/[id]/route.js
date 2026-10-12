import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/authz';
import { closeCoverDispute, validateDisputeNote } from '@/lib/db/coverDisputes';

// PATCH `{ status: 'closed', reply? }`: an admin closes a driver's "This is a
// mistake" message, with an optional answer the driver sees on /covers. The
// fix itself is the sheet's, or the account's link on its admin user page.
export async function PATCH(request, { params }) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (body?.status !== 'closed') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { note: reply, error } = validateDisputeNote(body.reply);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const result = await closeCoverDispute(id, reply, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, data: result.dispute });
  } catch (error) {
    console.error('Error closing a cover dispute:', error);
    return NextResponse.json({ error: "Couldn't close the dispute." }, { status: 500 });
  }
}
