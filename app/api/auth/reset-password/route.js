import { NextResponse } from 'next/server';

import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { isResetToken, redeemPasswordReset } from '@/lib/db/passwordResets';
import { passwordProblem } from '@/lib/password';

// Per network: the person here isn't signed in. Room for a building that
// shares one address, none for guessing tokens (which are 256 bits anyway).
const RESET_LIMIT = 10;
const RESET_WINDOW_MS = 15 * 60 * 1000;

const LINK_ERROR = 'This link has expired or was already used.';

// POST `{ token, password }` from /reset-password (docs/PASSWORD-RESET.md):
// sets the new password and uses up the link. Public: the link is the proof.
// Every bad link gets the same answer, which never says whose it was.
export async function POST(request) {
  const rate = await checkRateLimit({
    key: `password-reset:${getClientIp(request)}`,
    limit: RESET_LIMIT,
    windowMs: RESET_WINDOW_MS,
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
  if (!isResetToken(body?.token)) {
    return NextResponse.json({ error: LINK_ERROR }, { status: 400 });
  }
  const problem = passwordProblem(body?.password);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  try {
    const result = await redeemPasswordReset(body.token, body.password);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting a password:', error?.name, error?.code ?? '');
    return NextResponse.json(
      { error: "Couldn't change your password. Please try again." },
      { status: 500 },
    );
  }
}
