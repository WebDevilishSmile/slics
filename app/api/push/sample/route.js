import { NextResponse } from 'next/server';

import { requireSuperAdmin } from '@/lib/authz';
import { hasSample, sendSample } from '@/lib/pushEvents';
import { checkRateLimit } from '@/lib/rateLimit';

// POST `{ type }`: "Send me a sample" on /admin/super/notifications
// (docs/SUPER-ADMIN-HUB.md stage C). Sends what a kind of notification looks
// like, with made-up details, to the caller's own devices only, whatever kinds
// they chose. Super admin only. → { success, data: { sent, failed } }
export async function POST(request) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `push-sample:${session.user.id}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Too many samples. Try again in ${rate.retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (typeof body?.type !== 'string' || !hasSample(body.type)) {
    return NextResponse.json({ error: 'Unknown kind of notification.' }, { status: 400 });
  }

  // sendPush never throws: a failure comes back as nothing sent.
  const result = await sendSample(body.type, session.user.id, {
    id: session.user.id,
    name: session.user.name ?? null,
  });
  return NextResponse.json({ success: true, data: result });
}
