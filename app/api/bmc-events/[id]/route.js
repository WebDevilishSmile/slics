import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/authz';
import { recordAdminAction } from '@/lib/db/adminAudit';
import { deleteBmcEvent, getBmcEventSummary } from '@/lib/db/bmcEvents';

// DELETE one `bmc-events` row (docs/BMC-SUPPORT.md stage 2, "Delete" on the
// Supporters page's Recent list), for BMC's test deliveries. Written to
// `admin_audit` first (`support.deleted`, `from` the row's type, amount and
// date). Membership the event turned on isn't changed. Super admin only.
export async function DELETE(request, { params }) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const event = await getBmcEventSummary(id);
    if (!event) return NextResponse.json({ error: 'That event is already gone.' }, { status: 404 });

    await recordAdminAction({
      actor: session.user,
      action: 'support.deleted',
      targetType: 'bmc-event',
      targetId: event._id,
      targetName: null,
      from: event.text,
      to: null,
    });
    await deleteBmcEvent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting a support event:', error);
    return NextResponse.json({ error: "Couldn't delete that event." }, { status: 500 });
  }
}
