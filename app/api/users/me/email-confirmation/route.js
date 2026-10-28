import { after, NextResponse } from 'next/server';

import { requireUser } from '@/lib/authz';
import { getUserById, userHasPassword } from '@/lib/db/users';
import { sendEmailConfirmation } from '@/lib/emailConfirmationSend';
import { displayFirstName, displayName } from '@/lib/names';
import { checkRateLimit } from '@/lib/rateLimit';
import { siteOrigin } from '@/lib/siteOrigin';

// Per driver, so nobody can fill their own inbox (or anyone's, since the
// address is the account's, never the request's).
const SEND_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;

// POST from "Send link" on /profile (docs/SECURITY.md #8): emails the signed-in
// password account a new link that confirms its email, after the response.
// A Google account's email is Google's to confirm, and a confirmed one needs
// nothing, so both get a 409.
export async function POST(request) {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `email-confirm:${session.user.id}`,
    limit: SEND_LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many links sent. Please wait an hour and try again.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  try {
    const [user, hasPassword] = await Promise.all([
      getUserById(session.user.id),
      userHasPassword(session.user.id),
    ]);
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    if (!hasPassword) {
      return NextResponse.json(
        { error: 'Your account signs in with Google, which already confirmed your email.' },
        { status: 409 },
      );
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Your email is already confirmed.' }, { status: 409 });
    }

    const firstName =
      (typeof user.firstName === 'string' && displayName(user.firstName.trim())) ||
      displayFirstName(user.name) ||
      null;
    const origin = siteOrigin(request);
    after(() =>
      sendEmailConfirmation({ userId: user._id, email: user.email, firstName, origin }),
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending an email confirmation:', error?.name, error?.code ?? '');
    return NextResponse.json(
      { error: "Couldn't send the link. Please try again." },
      { status: 500 },
    );
  }
}
