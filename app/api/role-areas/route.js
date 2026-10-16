import { NextResponse } from 'next/server';

import { requireSuperAdmin } from '@/lib/authz';
import { setRoleArea, validateRoleArea } from '@/lib/db/appSettings';
import { checkRateLimit } from '@/lib/rateLimit';

// PATCH `{ role, area, on }`: one tool switch for a staff role on
// /admin/super/admins (docs/STAFF-ROLES.md, lib/db/appSettings.js). Super
// admin only; written to admin_audit before it's saved. Reaches everyone in
// the role on their next request. → { success, data: { areas, changed } }
export async function PATCH(request) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `role-areas:${session.user.id}`,
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many changes. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const valid = validateRoleArea(body ?? {});
  if (valid.error) return NextResponse.json({ error: valid.error }, { status: 400 });

  try {
    const data = await setRoleArea(valid, {
      id: session.user.id,
      name: session.user.name ?? null,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error saving a role tool switch:', error);
    return NextResponse.json({ error: "Couldn't save that switch. Try again." }, { status: 500 });
  }
}
