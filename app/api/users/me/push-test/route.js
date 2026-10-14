import { NextResponse } from 'next/server';

import { requirePush } from '@/lib/authz';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendPush } from '@/lib/push';

// POST: "Send a test" on /profile. Pushes a test notification to every device
// the caller turned notifications on for, and answers `{ sent, failed }` so the
// button can say whether it went. Behind the same gate as the subscription
// routes (requirePush, docs/PUSH-NOTIFICATIONS.md).
export async function POST() {
  const { session, denied } = await requirePush();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `push-test:${session.user.id}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Too many tests. Try again in ${rate.retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  // sendPush never throws: a failure comes back as nothing sent. A test goes to
  // every device the caller turned on, whatever kinds they chose.
  const result = await sendPush(
    [session.user.id],
    {
      title: 'SLICs',
      body: 'This is a test. Notifications are working.',
      url: `/profile/${session.user.id}`,
      tag: 'test',
    },
    { source: 'test', by: { id: session.user.id, name: session.user.name ?? null } },
  );
  return NextResponse.json({ success: true, data: result });
}
