import { after, NextResponse } from 'next/server';

import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { createPasswordReset, findResetAccount, resetUrl } from '@/lib/db/passwordResets';
import { sendEmail } from '@/lib/email';
import { googleAccountEmail, resetLinkEmail } from '@/lib/passwordResetEmails';
import { siteOrigin } from '@/lib/siteOrigin';
import { RESET_EMAIL_LINK_MINUTES } from '@/constants';

export const runtime = 'nodejs';

// An emailed link works for RESET_EMAIL_LINK_MINUTES, much less than an
// admin's 24 hours: the driver asked for it just now.
const LINK_MINUTES = RESET_EMAIL_LINK_MINUTES;

// Per address, so nobody can fill a driver's inbox; per network, so one
// person can't walk through every address. A building that shares one IP
// still has room.
const EMAIL_LIMIT = 3;
const IP_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const tooMany = (rate) =>
  NextResponse.json(
    { error: 'Too many reset requests. Please wait an hour and try again.' },
    { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
  );

// POST `{ email }` from "Forgot your password?" on /sign-in
// (docs/PASSWORD-RESET.md stage 3). Public. The answer is the same for every
// address, and the email goes out after the response (`after()`), so neither
// the answer nor its timing says whether the address has an account:
// - a password account gets a reset link that works once, for 30 minutes;
// - a Google account gets a note that it has no password here;
// - an address with no account gets nothing.
export async function POST(request) {
  const ipRate = await checkRateLimit({
    key: `forgot-password-ip:${getClientIp(request)}`,
    limit: IP_LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!ipRate.ok) return tooMany(ipRate);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  // Counted for every address, account or not, so a 429 says nothing either.
  const emailRate = await checkRateLimit({
    key: `forgot-password:${email}`,
    limit: EMAIL_LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!emailRate.ok) return tooMany(emailRate);

  const origin = siteOrigin(request);
  after(async () => {
    try {
      const account = await findResetAccount(email);
      if (!account) return;
      if (!account.hasPassword) {
        await sendEmail({ to: email, ...googleAccountEmail({ firstName: account.firstName, origin }) });
        return;
      }
      const { token } = await createPasswordReset(account.id, {
        via: 'email',
        ttlMs: LINK_MINUTES * 60 * 1000,
      });
      await sendEmail({
        to: email,
        ...resetLinkEmail({
          firstName: account.firstName,
          url: resetUrl(origin, token),
          minutes: LINK_MINUTES,
          origin,
        }),
      });
    } catch (error) {
      // The class and code only: a MongoDB error's message can quote the
      // email (docs/SECURITY.md #22).
      console.error('Forgot password failed:', error?.name, error?.code ?? '');
    }
  });

  return NextResponse.json({ success: true });
}
