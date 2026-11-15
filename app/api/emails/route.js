import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { after, NextResponse } from 'next/server';

import { COMPOSE_EMAIL_FROM_NAME, CONTACT_EMAIL, SITE_URL } from '@/constants';
import { requireSuperAdmin } from '@/lib/authz';
import { deleteBlobs, isOwnBlobUrl } from '@/lib/blob';
import { composedEmail, validateComposedEmail } from '@/lib/composedEmail';
import { markAdminActionFailed, recordAdminAction } from '@/lib/db/adminAudit';
import { sendEmail } from '@/lib/email';
import {
  detectAttachment,
  EMAIL_ATTACHMENT_PREFIX,
  EMAIL_ATTACHMENTS_MAX_BYTES,
  validateAttachments,
} from '@/lib/emailAttachments';
import { validateFlyers } from '@/lib/flyers';
import { checkRateLimit } from '@/lib/rateLimit';

// POST `{ to, subject, heading, message, buttonLabel, buttonUrl, note,
// signOff, copyMe, attachments, flyers }`: an email the super admin writes on /admin/super/email,
// in the account emails' look (lib/composedEmail.js). It goes through Resend
// from CONTACT_EMAIL, so replies land in the same inbox (ImprovMX → Gmail);
// `copyMe` BCCs that inbox, since a Resend send isn't in Gmail's Sent folder.
// Recorded in admin_audit before it's sent (the address and subject, never the
// message; attached files by name only). → { success, data: { to } }
//
// `attachments` are `[{ url, name, size }]`, files the browser already put in
// Blob (POST /api/emails/attachments, lib/emailAttachments.js). Each URL must
// be this store's, under `email-attachments/`; the file is read back and its
// first bytes must match its name before Resend gets it. Once Resend takes
// the email the files are deleted from Blob.
//
// `flyers` are keys from lib/flyers.js: the printed PDFs in docs/print/,
// bundled with this route and read from disk. They count toward the 20 MB.

const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000; // an hour

// Up to 20 MB of files read from Blob and handed to Resend.
export const maxDuration = 60;

// A file that can't go out as it is: the message is for the caller.
class AttachmentProblem extends Error {}

const READ_TIMEOUT_MS = 20_000;

// → [{ filename, contentType, content: Buffer }], in the order given.
async function readAttachments(attached) {
  const files = [];
  let total = 0;
  for (const file of attached) {
    const response = await fetch(file.url, { cache: 'no-store', signal: AbortSignal.timeout(READ_TIMEOUT_MS) });
    if (!response.ok) {
      throw new AttachmentProblem(`“${file.name}” is gone. Remove it and attach it again.`);
    }
    // A file bigger than the form said is refused before it's downloaded.
    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && total + declared > EMAIL_ATTACHMENTS_MAX_BYTES) {
      throw new AttachmentProblem('The files are too big together. Remove one and try again.');
    }
    const content = Buffer.from(await response.arrayBuffer());
    total += content.length;
    if (total > EMAIL_ATTACHMENTS_MAX_BYTES) {
      throw new AttachmentProblem('The files are too big together. Remove one and try again.');
    }
    const kind = detectAttachment(content, file.name);
    if (!kind) {
      throw new AttachmentProblem(`“${file.name}” isn’t the kind of file its name says. Attach it again, or another file.`);
    }
    files.push({ ...kind, content });
  }
  return files;
}

// → [{ filename, contentType, content: Buffer }] for the flyers picked, from
// the copies bundled with this route.
async function readFlyers(flyers) {
  const files = [];
  for (const flyer of flyers) {
    let content;
    try {
      // The folder is written out here, not imported: Next's file tracer
      // follows only literal paths, and with an imported one it packed the
      // whole project into this function (1.14 GB, over Vercel's 250 MB).
      content = await readFile(path.join(process.cwd(), 'docs', 'print', flyer.file));
    } catch {
      console.error(`Flyer missing from the deploy: ${flyer.file}`);
      throw new AttachmentProblem(`“${flyer.file}” isn’t in this version of the app. Remove it and send again.`);
    }
    const kind = detectAttachment(content, flyer.file);
    if (!kind) throw new AttachmentProblem(`“${flyer.file}” isn’t a PDF. Remove it and send again.`);
    files.push({ ...kind, content });
  }
  return files;
}

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
  const { value: attached, error: attachError } = validateAttachments(body?.attachments);
  if (attachError) return NextResponse.json({ error: attachError }, { status: 400 });
  const { value: flyers, error: flyerError } = validateFlyers(body?.flyers);
  if (flyerError) return NextResponse.json({ error: flyerError }, { status: 400 });
  if (attached.some((file) => !isOwnBlobUrl(file.url, EMAIL_ATTACHMENT_PREFIX))) {
    return NextResponse.json({ error: 'An attachment didn’t come through. Remove it and attach it again.' }, { status: 400 });
  }

  // Read every file back before anything is recorded or sent.
  let files;
  try {
    files = [...(await readFlyers(flyers)), ...(await readAttachments(attached))];
    if (files.reduce((sum, file) => sum + file.content.length, 0) > EMAIL_ATTACHMENTS_MAX_BYTES) {
      throw new AttachmentProblem('The files are too big together. Remove one and try again.');
    }
  } catch (caught) {
    if (caught instanceof AttachmentProblem) {
      return NextResponse.json({ error: caught.message }, { status: 400 });
    }
    console.error('Error reading the email attachments:', caught?.name ?? 'Error');
    return NextResponse.json({ error: "Couldn't read the attachments. Please try again." }, { status: 502 });
  }

  try {
    const auditId = await recordAdminAction({
      actor: { id: session.user.id, name: session.user.name ?? null },
      action: 'email.sent',
      targetType: 'email',
      targetName: value.to,
      to: value.subject,
      details: files.length ? { attachments: files.map((file) => file.filename) } : undefined,
    });

    const sent = await sendEmail({
      to: value.to,
      from: `${COMPOSE_EMAIL_FROM_NAME} <${CONTACT_EMAIL}>`,
      replyTo: CONTACT_EMAIL,
      bcc: value.copyMe ? CONTACT_EMAIL : undefined,
      ...composedEmail(value, { origin: SITE_URL }),
      attachments: files,
    });
    if (!sent) {
      await markAdminActionFailed(auditId);
      return NextResponse.json(
        { error: "Resend didn't take the email. Nothing was sent; try again in a moment." },
        { status: 502 },
      );
    }
    if (attached.length) after(() => deleteBlobs(attached.map((file) => file.url)));
    return NextResponse.json({ success: true, data: { to: value.to } });
  } catch (caught) {
    console.error('Error sending a written email:', caught?.name ?? 'Error');
    return NextResponse.json({ error: "Couldn't send the email. Please try again." }, { status: 500 });
  }
}
