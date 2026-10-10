import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/authz';
import { setAdminRole } from '@/lib/db/admins';

export const runtime = 'nodejs';

// Makes a user an admin, from the super admin's Admins page. Body: { userId }.
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

  try {
    const result = await setAdminRole(body.userId, true, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error adding an admin:', error);
    return NextResponse.json({ error: 'Failed to add the admin' }, { status: 500 });
  }
}
