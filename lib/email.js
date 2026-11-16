// Email through Resend (docs/archive/PASSWORD-RESET.md stage 3). Like lib/blob.js for
// Blob, this is the only module that talks to the provider. It calls Resend's
// REST API directly, so there's no SDK to keep up to date.
//
// It never throws and never logs an address: callers send from `after()`, and
// a failed email must not fail the request that asked for it. With
// RESEND_API_KEY unset (a local `.env` without it) nothing is sent.

const RESEND_URL = 'https://api.resend.com/emails';
// Up to 100 emails in one request, each to its own people. No attachments.
const RESEND_BATCH_URL = 'https://api.resend.com/emails/batch';
const BATCH_MAX = 100;
const BATCH_TIMEOUT_MS = 20_000;

// slics.app is verified in Resend (SPF and DKIM records on Vercel DNS).
const FROM = 'SLICs <no-reply@slics.app>';

const SEND_TIMEOUT_MS = 10_000;
// Files take longer to hand over (up to 20 MB, EMAIL_ATTACHMENTS_MAX_BYTES).
const SEND_WITH_FILES_TIMEOUT_MS = 45_000;

/**
 * Sends one email. Returns true when Resend accepted it, false otherwise.
 * `text` and `html` are the same message; mail apps pick one. `from` is
 * another slics.app sender (the super admin's written emails, from
 * CONTACT_EMAIL); `replyTo` and `bcc` are optional. `attachments` are
 * `[{ filename, contentType, content: Buffer }]`, checked by the caller
 * (lib/emailAttachments.js).
 */
export async function sendEmail({ to, subject, text, html, from = FROM, replyTo, bcc, attachments = [] }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Email not sent: RESEND_API_KEY is not set.');
    return false;
  }

  try {
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(bcc ? { bcc: [bcc] } : {}),
        ...(attachments.length
          ? {
              attachments: attachments.map((file) => ({
                filename: file.filename,
                content: file.content.toString('base64'),
                content_type: file.contentType,
              })),
            }
          : {}),
      }),
      signal: AbortSignal.timeout(attachments.length ? SEND_WITH_FILES_TIMEOUT_MS : SEND_TIMEOUT_MS),
    });
    if (!response.ok) {
      // Resend's error names the problem (a bad key, an unverified domain),
      // not the recipient.
      const detail = await response.json().catch(() => ({}));
      console.error('Email not sent:', response.status, detail?.name ?? '');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Email not sent:', error?.name ?? 'Error');
    return false;
  }
}

/**
 * Sends the same email to many people, one copy each, through Resend's batch
 * endpoint (100 a request; it takes no attachments, so a send with files goes
 * through sendEmail per person). `to` is the list of addresses, each a bare
 * address or `"Name" <address>`. → how many Resend accepted. Never throws.
 */
export async function sendEmailBatch({ to, subject, text, html, from = FROM, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Email not sent: RESEND_API_KEY is not set.');
    return 0;
  }
  let accepted = 0;
  for (let start = 0; start < to.length; start += BATCH_MAX) {
    const chunk = to.slice(start, start + BATCH_MAX);
    try {
      const response = await fetch(RESEND_BATCH_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(
          chunk.map((address) => ({
            from,
            to: [address],
            subject,
            text,
            html,
            ...(replyTo ? { reply_to: replyTo } : {}),
          })),
        ),
        signal: AbortSignal.timeout(BATCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        console.error('Email batch not sent:', response.status, detail?.name ?? '');
        continue;
      }
      accepted += chunk.length;
    } catch (error) {
      console.error('Email batch not sent:', error?.name ?? 'Error');
    }
  }
  return accepted;
}
