import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/authz';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  deletePushSubscription,
  savePushSubscription,
  validatePushSubscription,
} from '@/lib/db/pushSubscriptions';

// The signed-in driver's push notification devices (docs/PUSH-NOTIFICATIONS.md).
// Admin-only in stage 1; stage 2 opens it to every driver with requireUser().

// Per driver, not per network: drivers share the building's wifi. The profile
// toggle re-saves a device's subscription on every visit, so leave headroom.
const SAVE_LIMIT = 30;
const SAVE_WINDOW_MS = 60 * 60 * 1000; // an hour

// POST: a `PushSubscription.toJSON()`, `{ endpoint, keys: { p256dh, auth } }`.
// Saves this device for the caller, or moves it to them.
export async function POST(request) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `push-subscribe:${session.user.id}`,
    limit: SAVE_LIMIT,
    windowMs: SAVE_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many tries. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { subscription, error } = validatePushSubscription(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    await savePushSubscription(session.user.id, subscription);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving a push subscription:', error);
    return NextResponse.json(
      { error: "Couldn't turn on notifications. Please try again." },
      { status: 500 },
    );
  }
}

// DELETE `{ endpoint }`: turns this device off. Only the caller's own device;
// one that's already gone is still a success.
export async function DELETE(request) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  if (!endpoint || endpoint.length > 1024) {
    return NextResponse.json({ error: 'Invalid push subscription.' }, { status: 400 });
  }

  try {
    await deletePushSubscription(endpoint, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting a push subscription:', error);
    return NextResponse.json(
      { error: "Couldn't turn off notifications. Please try again." },
      { status: 500 },
    );
  }
}
