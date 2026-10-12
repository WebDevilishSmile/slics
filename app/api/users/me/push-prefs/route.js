import { NextResponse } from 'next/server';

import { PUSH_TYPES } from '@/constants';
import { isSuperAdmin, requireAdmin } from '@/lib/authz';
import { checkRateLimit } from '@/lib/rateLimit';
import { getPushPrefs, setPushPref } from '@/lib/db/users';

// The kinds of push notification the signed-in admin gets
// (docs/PUSH-NOTIFICATIONS.md, stage 1b; PUSH_TYPES in constants.js). Per
// account, so a switch applies to every device they turned on. Admin-only like
// the subscription routes; a super-admin kind only for a super admin.

// Per admin, generous: each switch saves on its own.
const LIMIT = 120;
const WINDOW_MS = 60 * 60 * 1000; // an hour

// PATCH `{ key, on }` → `{ success, data: prefs }`, every kind this account
// may choose, resolved.
export async function PATCH(request) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `push-prefs:${session.user.id}`,
    limit: LIMIT,
    windowMs: WINDOW_MS,
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

  const type = PUSH_TYPES.find((entry) => entry.key === body?.key);
  if (!type || typeof body?.on !== 'boolean') {
    return NextResponse.json({ error: 'Unknown notification setting.' }, { status: 400 });
  }
  const superAdmin = isSuperAdmin(session);
  if (type.audience === 'superAdmin' && !superAdmin) {
    return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
  }

  try {
    await setPushPref(session.user.id, type.key, body.on);
    return NextResponse.json({
      success: true,
      data: await getPushPrefs(session.user.id, { superAdmin }),
    });
  } catch (error) {
    console.error('Error saving a notification setting:', error);
    return NextResponse.json(
      { error: "Couldn't save that setting. Please try again." },
      { status: 500 },
    );
  }
}
