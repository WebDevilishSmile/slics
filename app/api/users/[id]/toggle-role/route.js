import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/authz';
import { getUserById } from '@/lib/db/users';
import { setAdminRole } from '@/lib/db/admins';

export const runtime = 'nodejs';

// The role chip on /admin/users. Super-admin-only since the super admin role
// (2026-10-10); every change is written to `admin_audit` first.
export async function PATCH(req, { params }) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const { id: userId } = await params;

  try {
    const target = await getUserById(userId).catch(() => null);
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await setAdminRole(userId, target.role !== 'admin', session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.user, { status: 200 });
  } catch (error) {
    console.error('API Error: Uncaught error in PATCH /toggle-role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
