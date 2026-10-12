// Email through Resend (docs/PASSWORD-RESET.md stage 3). Like lib/blob.js for
// Blob, this is the only module that talks to the provider. It calls Resend's
// REST API directly, so there's no SDK to keep up to date.
//
// It never throws and never logs an address: callers send from `after()`, and
// a failed email must not fail the request that asked for it. With
// RESEND_API_KEY unset (a local `.env` without it) nothing is sent.

const RESEND_URL = 'https://api.resend.com/emails';

// slics.app is verified in Resend (SPF and DKIM records on Vercel DNS).
const FROM = 'SLICs <no-reply@slics.app>';

const SEND_TIMEOUT_MS = 10_000;

/**
 * Sends one email. Returns true when Resend accepted it, false otherwise.
 * `text` and `html` are the same message; mail apps pick one.
 */
export async function sendEmail({ to, subject, text, html }) {
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
      body: JSON.stringify({ from: FROM, to: [to], subject, text, html }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
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
