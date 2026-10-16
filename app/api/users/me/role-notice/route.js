import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/authz';
import { clearRoleNotice } from '@/lib/db/users';

// POST: the signed-in account opened or dismissed its welcome note on /home
// (staff/WelcomeCard.jsx, docs/STAFF-ROLES.md). Clears `roleNotice` so it
// doesn't come back. Idempotent.
export async function POST() {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  try {
    await clearRoleNotice(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error: role-notice POST:', error);
    return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  }
}
