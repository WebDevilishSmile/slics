import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/authz';
import { setCoversAccess } from '@/lib/db/users';
import { toCoversAccess } from '@/lib/serializers';

export const runtime = 'nodejs';

// Covers early access, the switch on /admin/users and the user's page
// (docs/COVER-BIDDING.md): lets one account into Covers before it opens to
// every driver. Super admin only, like the "Covers for every driver" switch;
// every change is written to `admin_audit` first. Body: { on: boolean }, a
// value rather than a toggle, so a double tap can't undo itself.
export async function PUT(request, { params }) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.on !== 'boolean') {
    return NextResponse.json({ error: 'Say whether to turn it on or off.' }, { status: 400 });
  }

  try {
    const result = await setCoversAccess(id, body.on, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    // Only what the switch reads, not the user document (SECURITY.md #6).
    return NextResponse.json({
      success: true,
      data: { coversAccess: toCoversAccess(result.user) },
    });
  } catch (error) {
    console.error('Error saving Covers early access:', error);
    return NextResponse.json({ error: "Couldn't save Covers early access." }, { status: 500 });
  }
}
