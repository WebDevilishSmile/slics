import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/authz';
import { setAdminRole } from '@/lib/db/admins';

export const runtime = 'nodejs';

// Takes the admin role away (back to `user`), from the super admin's Admins
// page. A super admin can't be removed, and nobody removes themselves.
export async function DELETE(request, { params }) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const { id } = await params;

  try {
    const result = await setAdminRole(id, false, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error removing an admin:', error);
    return NextResponse.json({ error: 'Failed to remove the admin' }, { status: 500 });
  }
}
