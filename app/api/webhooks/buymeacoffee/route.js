import crypto from 'crypto';
import { NextResponse } from 'next/server';

import {
  findUserIdByEmail,
  parseBmcEvent,
  recordBmcEvent,
  setBmcMember,
} from '@/lib/db/bmcEvents';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { secretsMatch } from '@/lib/secretsMatch';

export const runtime = 'nodejs';

// Buy Me a Coffee events (docs/BMC-SUPPORT.md, SECURITY.md #14). Every signed
// delivery is saved to `bmc-events`; membership events also turn the matched
// account's `bmcMember` on or off. A repeat of a body already seen (a retry,
// or a captured request replayed later) is acknowledged and does nothing.
const MEMBERSHIP = {
  'membership.started': true,
  'membership.cancelled': false,
  'membership.canceled': false,
};

// Pre-auth, so limited by IP. BMC sends a handful a day; this only stops a
// flood of forged requests from reaching the HMAC and the database.
const LIMIT = 60;
const WINDOW_MS = 60 * 1000;

export async function POST(request) {
  const secret = process.env.BMC_WEBHOOK_SECRET;
  if (!secret) {
    console.error('BMC webhook: BMC_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const rate = await checkRateLimit({
    key: `bmc-webhook:${getClientIp(request)}`,
    limit: LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  // The HMAC is over the exact bytes received, so read the body as text.
  // Header name per third-party docs and the code that has worked so far.
  const signature = request.headers.get('x-signature-sha256');
  const rawBody = await request.text();
  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (!secretsMatch(signature.trim().toLowerCase(), expected)) {
    console.warn('BMC webhook: signature mismatch.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const fields = parseBmcEvent(rawBody, body);
    const userId = await findUserIdByEmail(fields.email);
    const { duplicate, event } = await recordBmcEvent({ ...fields, userId });
    if (duplicate) {
      return NextResponse.json({ message: 'Already processed' }, { status: 200 });
    }

    // Logs name the event and the account id, never the supporter's email.
    const member = MEMBERSHIP[fields.type];
    if (member !== undefined && userId) {
      const before = await setBmcMember(userId, member);
      console.log(
        `BMC webhook: ${fields.type} → user ${userId} bmcMember ${before} → ${member} (event ${event._id}).`,
      );
    } else {
      console.log(
        `BMC webhook: ${fields.type} saved as event ${event._id}${userId ? ` for user ${userId}` : ' (no matching account)'}.`,
      );
    }

    return NextResponse.json({ message: 'Webhook received and processed' }, { status: 200 });
  } catch (error) {
    console.error('BMC webhook: error processing event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
