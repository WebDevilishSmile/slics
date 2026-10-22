import { NextResponse } from 'next/server';

import { isVerifiedDriver, requireCovers } from '@/lib/authz';
import { checkRateLimit } from '@/lib/rateLimit';
import { setCoverReminderLeads, validateReminderLeads } from '@/lib/db/users';

// How long before their call-in time the signed-in driver is reminded on bid
// day (docs/PUSH-NOTIFICATIONS.md, stage 3): the chips under "Call-in
// reminder" on /profile. Per account, like the kinds. Only a verified cover
// driver has a call-in time to be reminded of.

// Per driver, generous: each chip saves on its own.
const LIMIT = 120;
const WINDOW_MS = 60 * 60 * 1000; // an hour

// PUT `{ leads: [15, 120] }` (minutes, from COVER_REMINDER_LEADS) →
// `{ success, data: leads }`, shortest first.
export async function PUT(request) {
  const { session, denied } = await requireCovers();
  if (denied) return denied;
  if (!isVerifiedDriver(session)) {
    return NextResponse.json(
      { error: 'Only verified drivers get call-in reminders.' },
      { status: 403 },
    );
  }

  const rate = await checkRateLimit({
    key: `cover-reminders:${session.user.id}`,
    limit: LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many changes. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { error, leads } = validateReminderLeads(body?.leads);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    return NextResponse.json({
      success: true,
      data: await setCoverReminderLeads(session.user.id, leads),
    });
  } catch (error) {
    console.error('Error saving call-in reminder times:', error);
    return NextResponse.json(
      { error: "Couldn't save that. Please try again." },
      { status: 500 },
    );
  }
}
