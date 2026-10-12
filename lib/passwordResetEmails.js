// The two emails "Forgot your password?" sends (docs/PASSWORD-RESET.md stage
// 3), each as `{ subject, text, html }` for lib/email.js. Plain on purpose: no
// images, no tracking, one link. They say only that someone asked, never who.
// Mail apps don't read the theme, so the HTML has literal colors: the light
// scheme's primary.main (lightBlue[800]) for the button.

const BLUE = '#0277bd';
const TEXT = '#1f2937';
const MUTED = '#6b7280';

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const greeting = (firstName) => (firstName ? `Hi ${firstName},` : 'Hi,');

// One column of paragraphs and an optional button, in a frame every mail app
// draws the same way.
function layout({ firstName, paragraphs, button, footer, origin }) {
  const p = (html, color = TEXT) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${color}">${html}</p>`;
  const buttonHtml = button
    ? `<p style="margin:24px 0"><a href="${escapeHtml(button.href)}" style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:12px 24px;border-radius:999px">${escapeHtml(button.label)}</a></p>`
    : '';
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#edf3fc">
<div style="max-width:32rem;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
${p(escapeHtml(greeting(firstName)))}
${paragraphs.map((html) => p(html)).join('\n')}
${buttonHtml}
${footer.map((html) => p(html, MUTED)).join('\n')}
${p(`SLICs · <a href="${escapeHtml(origin)}" style="color:${MUTED}">${escapeHtml(new URL(origin).host)}</a>`, MUTED)}
</div>
</body>
</html>`;
}

/** The reset link, for an account with a password. */
export function resetLinkEmail({ firstName, url, minutes, origin }) {
  const subject = 'Reset your SLICs password';
  const text = [
    greeting(firstName),
    'Someone asked to reset the password for your SLICs account. If it was you, open this link to choose a new password:',
    url,
    `The link works once, for ${minutes} minutes. After that, ask for a new one on the sign-in page.`,
    "If it wasn't you, ignore this email. Your password stays the same.",
    `SLICs · ${origin}`,
  ].join('\n\n');
  const html = layout({
    firstName,
    origin,
    paragraphs: [
      'Someone asked to reset the password for your SLICs account. If it was you, tap the button to choose a new password.',
    ],
    button: { href: url, label: 'Choose a new password' },
    footer: [
      `The link works once, for ${minutes} minutes. After that, ask for a new one on the sign-in page.`,
      "If it wasn't you, ignore this email. Your password stays the same.",
    ],
  });
  return { subject, text, html };
}

/** For an account that signs in with Google: there's no password to reset. */
export function googleAccountEmail({ firstName, origin }) {
  const signInUrl = `${origin}/sign-in`;
  const subject = 'How you sign in to SLICs';
  const text = [
    greeting(firstName),
    'Someone asked to reset the password for your SLICs account. Your account signs in with Google, so it has no SLICs password.',
    `To sign in, tap "Continue with Google" on ${signInUrl}`,
    "If you can't get into your Google account, Google can help: https://accounts.google.com/signin/recovery",
    "If it wasn't you, ignore this email. Nothing has changed.",
    `SLICs · ${origin}`,
  ].join('\n\n');
  const html = layout({
    firstName,
    origin,
    paragraphs: [
      'Someone asked to reset the password for your SLICs account. Your account signs in with Google, so it has no SLICs password.',
      'To sign in, tap <strong>Continue with Google</strong> on the sign-in page.',
    ],
    button: { href: signInUrl, label: 'Go to sign-in' },
    footer: [
      `If you can't get into your Google account, <a href="https://accounts.google.com/signin/recovery" style="color:${MUTED}">Google can help</a>.`,
      "If it wasn't you, ignore this email. Nothing has changed.",
    ],
  });
  return { subject, text, html };
}
