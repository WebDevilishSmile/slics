import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/authz';
import { checkRateLimit } from '@/lib/rateLimit';
import { changePassword } from '@/lib/db/passwordResets';
import { passwordProblem } from '@/lib/password';

// Per driver: a few tries for typos, none for guessing. Every try also counts
// toward the sign-in limit for the account's email (auth.js, `login:<email>`,
// 10 per 15 minutes), so guesses here and at sign-in share one budget.
const CHANGE_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT_PER_EMAIL = 10;

const tooMany = (rate) =>
  NextResponse.json(
    { error: 'Too many tries. Please wait 15 minutes and try again.' },
    { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
  );

// POST `{ currentPassword, newPassword }` from /profile's "Change password"
// (docs/PASSWORD-RESET.md stage 2). On success every device is signed out,
// this one included: the client signs out and sends the driver to sign in.
export async function POST(request) {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { currentPassword, newPassword } = body ?? {};
  if (typeof currentPassword !== 'string' || !currentPassword) {
    return NextResponse.json({ error: 'Enter your current password.' }, { status: 400 });
  }
  const problem = passwordProblem(newPassword);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const email = session.user.email?.trim().toLowerCase();
  const [byUser, byEmail] = await Promise.all([
    checkRateLimit({ key: `password-change:${session.user.id}`, limit: CHANGE_LIMIT, windowMs: WINDOW_MS }),
    email
      ? checkRateLimit({ key: `login:${email}`, limit: LOGIN_LIMIT_PER_EMAIL, windowMs: WINDOW_MS })
      : { ok: true },
  ]);
  if (!byUser.ok) return tooMany(byUser);
  if (!byEmail.ok) return tooMany(byEmail);

  try {
    const result = await changePassword(session.user.id, currentPassword, newPassword);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing a password:', error?.name, error?.code ?? '');
    return NextResponse.json(
      { error: "Couldn't change your password. Please try again." },
      { status: 500 },
    );
  }
}
