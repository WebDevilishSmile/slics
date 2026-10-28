import { after, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { registrationProblem } from '@/lib/registration';
import client from '@/lib/db/client';
import { sendEmailConfirmation } from '@/lib/emailConfirmationSend';
import { displayName } from '@/lib/names';
import { notifySignUp } from '@/lib/pushEvents';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { siteOrigin } from '@/lib/siteOrigin';

// Generous on purpose: a whole building of drivers can share one egress IP,
// so this has to stop scripted abuse without locking out a shift that signs
// up together. Scripted abuse looks like thousands, not tens.
const REGISTER_LIMIT = 10;
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// The initials go inside SVG markup, so a name starting with `<` or `&`
// can't break it (docs/SECURITY.md #8 step 5).
const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function initialsAvatar(first, last) {
  const initials = escapeXml(`${first[0].toUpperCase()}${last[0].toUpperCase()}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><rect width="40" height="40" rx="20" fill="#0288d1"/><text x="20" y="20" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="16" font-weight="bold" fill="white">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export async function POST(request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit({
    key: `register:${ip}`,
    limit: REGISTER_LIMIT,
    windowMs: REGISTER_WINDOW_MS,
  });

  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many sign-up attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  // Every field typed and trimmed first: a name of only spaces used to pass
  // and then fail on its initial (a 500).
  const { fields, error } = registrationProblem(body);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const { email: emailLower, firstName: firstTrimmed, lastName: lastTrimmed, password } = fields;

  try {
    const db = client.db();
    const existing = await db
      .collection('users')
      .findOne({ email: emailLower });

    if (existing) {
      return NextResponse.json(
        // Says how to get in, since a driver here may have joined with Google
        // and forgotten. The 409 already tells the caller the account exists.
        {
          error:
            'That email already has a SLICs account. Sign in, or use Continue with Google if that’s how you joined.',
        },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const { insertedId } = await db.collection('users').insertOne({
      name: `${firstTrimmed} ${lastTrimmed}`,
      firstName: firstTrimmed,
      lastName: lastTrimmed,
      email: emailLower,
      password: hashedPassword,
      image: initialsAvatar(firstTrimmed, lastTrimmed),
      emailVerified: null,
      role: 'user',
      comments: [],
      bmcMember: false,
      created_at: new Date(),
    });

    // A push to the admins who chose sign-ups, after the response. No name or
    // email on a lock screen.
    after(() => notifySignUp());
    // The link that confirms the email (docs/SECURITY.md #8). The account
    // works without it; it's what lets the app trust the address.
    const origin = siteOrigin(request);
    after(() =>
      sendEmailConfirmation({
        userId: insertedId,
        email: emailLower,
        firstName: displayName(firstTrimmed),
        origin,
      }),
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    // The error's class and code only: a MongoDB error's message can quote
    // the email it failed on (docs/SECURITY.md #22).
    console.error('Registration failed:', error?.name, error?.code ?? '');
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
