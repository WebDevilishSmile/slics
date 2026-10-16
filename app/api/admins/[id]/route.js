import { NextResponse } from 'next/server';
import { STAFF_ROLES } from '@/constants';
import { requireSuperAdmin } from '@/lib/authz';
import { setUserRole } from '@/lib/db/admins';

export const runtime = 'nodejs';

// Moves a staff member between Admin and Dispatch, from the super admin's
// Admins page (docs/STAFF-ROLES.md). Body: { role }.
export async function PATCH(request, { params }) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!STAFF_ROLES.includes(body?.role)) {
    return NextResponse.json({ error: 'Choose Admin or Dispatch.' }, { status: 400 });
  }

  try {
    const result = await setUserRole(id, body.role, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error changing a staff role:', error);
    return NextResponse.json({ error: 'Failed to change the role' }, { status: 500 });
  }
}

// Takes the staff role away (back to `user`), from the super admin's Admins
// page. A super admin can't be removed, and nobody removes themselves.
export async function DELETE(request, { params }) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const { id } = await params;

  try {
    const result = await setUserRole(id, 'user', session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error removing a staff member:', error);
    return NextResponse.json({ error: 'Failed to remove them' }, { status: 500 });
  }
}
