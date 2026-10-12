import { NextResponse } from 'next/server';

import { requireSuperAdmin } from '@/lib/authz';
import { setFeature, validateFeature } from '@/lib/db/appSettings';
import { checkRateLimit } from '@/lib/rateLimit';

// PATCH `{ key, value }`: one feature switch on /admin/super/features
// (docs/SUPER-ADMIN-HUB.md stage F, lib/db/appSettings.js). Super admin only;
// written to admin_audit before it's saved. Reaches every driver on their
// next request. → { success, data: features }
export async function PATCH(request) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `features:${session.user.id}`,
    limit: 30,
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
  const { value, error } = validateFeature(body?.key, body?.value);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const features = await setFeature(body.key, value, {
      id: session.user.id,
      name: session.user.name ?? null,
    });
    return NextResponse.json({ success: true, data: features });
  } catch (error) {
    console.error('Error saving a feature switch:', error);
    return NextResponse.json({ error: "Couldn't save that. Please try again." }, { status: 500 });
  }
}
