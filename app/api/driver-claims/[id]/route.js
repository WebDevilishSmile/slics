import { NextResponse } from 'next/server';
import { requireArea } from '@/lib/authz';
import { decideDriverClaim } from '@/lib/db/driverClaims';

// PATCH `{ status: 'approved', name }` (link the account to `name`, the
// driver as the sheet spells it) or `{ status: 'rejected', note }` (a reason
// the driver sees). Admin only, and never on your own claim unless you're the
// super admin (lib/db/driverClaims.js).
export async function PATCH(request, { params }) {
  const { session, denied } = await requireArea('driverClaims');
  if (denied) return denied;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const result = await decideDriverClaim(id, body, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, data: result.claim });
  } catch (error) {
    console.error('Error deciding a driver claim:', error);
    return NextResponse.json({ error: "Couldn't save the decision." }, { status: 500 });
  }
}
