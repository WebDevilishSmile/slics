import { NextResponse } from 'next/server';
import { STAFF_ROLES } from '@/constants';
import { requireSuperAdmin } from '@/lib/authz';
import { setUserRole } from '@/lib/db/admins';

export const runtime = 'nodejs';

// Adds someone to the staff, from the super admin's Admins page
// (docs/STAFF-ROLES.md). Body: { userId, role }, `role` 'admin' or
// 'dispatch'; a page opened before dispatch existed sends no role, which
// means admin.
export async function POST(request) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (typeof body?.userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  const role = body.role ?? 'admin';
  if (!STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Choose Admin or Dispatch.' }, { status: 400 });
  }

  try {
    const result = await setUserRole(body.userId, role, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error adding a staff member:', error);
    return NextResponse.json({ error: 'Failed to add them' }, { status: 500 });
  }
}
