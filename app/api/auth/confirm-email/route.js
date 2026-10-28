import { after, NextResponse } from 'next/server';

import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { applyMembershipFromEvents } from '@/lib/db/bmcEvents';
import { isConfirmToken, redeemEmailConfirmation } from '@/lib/db/emailConfirmations';

// Per network: whoever opens the link may not be signed in. Room for a
// building that shares one address, none for guessing tokens (256 bits).
const CONFIRM_LIMIT = 10;
const CONFIRM_WINDOW_MS = 15 * 60 * 1000;

const LINK_ERROR = 'This link has expired or was already used.';

// POST `{ token }` from /confirm-email (docs/SECURITY.md #8): confirms the
// email the link was sent to and uses it up. Public: the link is the proof,
// and it can be opened in a browser that isn't signed in (a mail app's).
// Every bad link gets the same answer, which never says whose it was.
export async function POST(request) {
  const rate = await checkRateLimit({
    key: `email-confirm-ip:${getClientIp(request)}`,
    limit: CONFIRM_LIMIT,
    windowMs: CONFIRM_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many tries. Please wait 15 minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (!isConfirmToken(body?.token)) {
    return NextResponse.json({ error: LINK_ERROR }, { status: 400 });
  }

  try {
    const result = await redeemEmailConfirmation(body.token);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    // A Buy Me a Coffee membership that waited for this (lib/db/bmcEvents.js).
    after(() => applyMembershipFromEvents(result.userId, result.email));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming an email:', error?.name, error?.code ?? '');
    return NextResponse.json(
      { error: "Couldn't confirm your email. Please try again." },
      { status: 500 },
    );
  }
}
