import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/authz';
import { saveAskedHomeBase } from '@/lib/db/homeBase';
import { homeBaseIsFixed, validateHomeBaseInput } from '@/lib/homeBase';
import { checkRateLimit } from '@/lib/rateLimit';
import { toHomeBase } from '@/lib/serializers';

// Per driver, not per network: drivers share the building's wifi.
const LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000; // an hour

// PUT `{ numSlic, alphaSlic, name? }`: the signed-in driver says which
// building they work out of (docs/MULTI-HUB.md "Home base", step 3), from the
// card on /home or Change on /profile. Saved as `source: 'asked'`; whether the
// All Hubs list has it (`listed`) is the server's call, never the body's. A
// verified driver's or staff's is fixed (homeBaseIsFixed): 403.
// → { homeBase } (toHomeBase).
export async function PUT(request) {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  if (homeBaseIsFixed(session.user)) {
    return NextResponse.json(
      { error: 'Your building comes from the on-call sheet. Ask an admin to change it.' },
      { status: 403 },
    );
  }

  const rate = await checkRateLimit({
    key: `home-base:${session.user.id}`,
    limit: LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You've changed it a lot. Please try again later." },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { value, error } = validateHomeBaseInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const result = await saveAskedHomeBase(session.user.id, value);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ homeBase: toHomeBase(result.homeBase) });
  } catch (error) {
    console.error('API Error: home-base PUT:', error);
    return NextResponse.json({ error: "Couldn't save your building. Please try again." }, { status: 500 });
  }
}
