import { NextResponse } from 'next/server';

import { COMPOSE_EMAIL_FROM_NAME, CONTACT_EMAIL, SITE_URL } from '@/constants';
import { requireSuperAdmin } from '@/lib/authz';
import { composedEmail, validateComposedEmail } from '@/lib/composedEmail';
import { markAdminActionFailed, recordAdminAction } from '@/lib/db/adminAudit';
import { sendEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rateLimit';

// POST `{ to, subject, heading, message, buttonLabel, buttonUrl, note,
// signOff, copyMe }`: an email the super admin writes on /admin/super/email,
// in the account emails' look (lib/composedEmail.js). It goes through Resend
// from CONTACT_EMAIL, so replies land in the same inbox (ImprovMX → Gmail);
// `copyMe` BCCs that inbox, since a Resend send isn't in Gmail's Sent folder.
// Recorded in admin_audit before it's sent (the address and subject, never the
// message). → { success, data: { to } }

const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000; // an hour

export async function POST(request) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `email-compose:${session.user.id}`,
    limit: LIMIT,
    windowMs: WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You've sent a lot of emails. Please try again later." },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { value, error } = validateComposedEmail(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const auditId = await recordAdminAction({
      actor: { id: session.user.id, name: session.user.name ?? null },
      action: 'email.sent',
      targetType: 'email',
      targetName: value.to,
      to: value.subject,
    });

    const sent = await sendEmail({
      to: value.to,
      from: `${COMPOSE_EMAIL_FROM_NAME} <${CONTACT_EMAIL}>`,
      replyTo: CONTACT_EMAIL,
      bcc: value.copyMe ? CONTACT_EMAIL : undefined,
      ...composedEmail(value, { origin: SITE_URL }),
    });
    if (!sent) {
      await markAdminActionFailed(auditId);
      return NextResponse.json(
        { error: "Resend didn't take the email. Nothing was sent; try again in a moment." },
        { status: 502 },
      );
    }
    return NextResponse.json({ success: true, data: { to: value.to } });
  } catch (caught) {
    console.error('Error sending a written email:', caught?.name ?? 'Error');
    return NextResponse.json({ error: "Couldn't send the email. Please try again." }, { status: 500 });
  }
}
