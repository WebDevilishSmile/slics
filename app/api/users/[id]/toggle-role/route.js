import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/authz';
import { getUserById } from '@/lib/db/users';
import { setUserRole } from '@/lib/db/admins';

export const runtime = 'nodejs';

// The role menu on /admin/users. Super-admin-only since the super admin role
// (2026-10-10); every change is written to `admin_audit` first. Body:
// { role } ('user', 'dispatch' or 'admin', docs/STAFF-ROLES.md). A page
// opened before dispatch existed sends no body and means the old toggle: a
// driver becomes an admin, anyone else goes back to a driver, so it can never
// promote a dispatcher.
export async function PATCH(req, { params }) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const { id: userId } = await params;
  const body = await req.json().catch(() => null);

  try {
    const target = await getUserById(userId).catch(() => null);
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const role = body?.role ?? ((target.role || 'user') === 'user' ? 'admin' : 'user');
    const result = await setUserRole(userId, role, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    // Only what the role chip reads, not the user document (SECURITY.md #6).
    return NextResponse.json({ _id: userId, role: result.user.role ?? 'user' }, { status: 200 });
  } catch (error) {
    console.error('API Error: Uncaught error in PATCH /toggle-role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
