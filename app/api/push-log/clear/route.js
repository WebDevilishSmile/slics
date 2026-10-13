import { NextResponse } from 'next/server';

import { requireSuperAdmin } from '@/lib/authz';
import { clearPushFailures, undoClearPushFailures } from '@/lib/db/pushLog';
import { errorResponse } from '@/lib/httpError';
import { checkRateLimit } from '@/lib/rateLimit';

// POST: "Clear" on /admin/super/notifications. Failures up to now stop raising
// the warning on the page, the hub card and System health; the log rows stay.
// DELETE: "Undo", the mark back where it was. Super admin only, each written
// to admin_audit first (lib/db/pushLog.js). → { success, data: stats }

async function handle(change, label) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `push-clear:${session.user.id}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many changes. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  try {
    const stats = await change({ id: session.user.id, name: session.user.name ?? null });
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error(`Error ${label}:`, error);
    return errorResponse(error, "Couldn't save that. Please try again.");
  }
}

export const POST = () => handle(clearPushFailures, 'clearing push failures');

export const DELETE = () => handle(undoClearPushFailures, 'undoing the push failures clear');
