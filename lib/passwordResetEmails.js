// The account emails, each as `{ subject, text, html }` for lib/email.js: the
// two "Forgot your password?" sends (docs/PASSWORD-RESET.md stage 3), and the
// link that confirms a password account's email (docs/SECURITY.md #8). Plain
// on purpose: no images, no web fonts, no tracking, one link. The reset ones
// say only that someone asked, never who.
//
// The HTML is the app's soft look (CLAUDE.md "Visual style") as far as mail
// apps allow: one surface, a raised card, the note in an inset well, a pill
// button. Mail apps don't read the theme, so the colors and shadows below are
// theme.js's tokens and `softShadow` written out. Tables and inline styles
// keep the layout in Gmail and Outlook; the <style> block only adds the dark
// scheme (Apple Mail, iOS Mail) and phone padding. Gmail and Outlook draw no
// shadows, so the card is just the surface there, which still reads fine.

const LIGHT = {
  surface: '#edf3fc', // canvas
  text: '#1f2021', // text.primary (black at 0.87) on the canvas
  muted: '#5f6165', // text.secondary (black at 0.6) on the canvas, 5.8:1
  brand: '#0172b5', // ink, primary.main
  label: '#ffffff',
  shade: 'rgba(1, 87, 155, 0.16)', // brand[900]
  highlight: 'rgba(255, 255, 255, 0.9)',
};
const DARK = {
  surface: '#15181c', // night
  text: '#f7f7f7', // chalk
  muted: '#b9babb', // white at 0.7 on night
  brand: '#039be5', // brand[600], dark primary.main, which takes a dark label
  label: '#111111',
  shade: 'rgba(5, 5, 5, 0.7)', // void
  highlight: 'rgba(247, 247, 247, 0.06)',
};

// theme.js `softShadow`: a shadow down-right and a highlight up-left.
const soft = (c, x, blur, inset = '') =>
  `${inset}${x}px ${x}px ${blur}px ${c.shade}, ${inset}-${x}px -${x}px ${blur}px ${c.highlight}`;
const raised = (c) => soft(c, 6, 14);
const raisedSmall = (c) => soft(c, 3, 7);
const insetWell = (c) => soft(c, 3, 7, 'inset ');

const FONT = "Montserrat,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const WIDTH = 480;

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const greeting = (firstName) => (firstName ? `Hi ${firstName},` : 'Hi,');

// Classes are hooks for the dark scheme only; every light value is inline.
const STYLE = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media (prefers-color-scheme: dark) {
  .s-surface { background: ${DARK.surface} !important; }
  .s-card { background: ${DARK.surface} !important; box-shadow: ${raised(DARK)} !important; }
  .s-well { background: ${DARK.surface} !important; box-shadow: ${insetWell(DARK)} !important; }
  .s-text { color: ${DARK.text} !important; }
  .s-muted { color: ${DARK.muted} !important; }
  .s-brand { color: ${DARK.brand} !important; }
  .s-button { background: ${DARK.brand} !important; box-shadow: ${raisedSmall(DARK)} !important; }
  .s-label { color: ${DARK.label} !important; }
}
@media (max-width: 520px) {
  .s-outer { padding: 24px 12px !important; }
  .s-pad { padding: 28px 20px !important; }
}`;

const para = (html, { muted = false, size = 16, margin = '0 0 16px' } = {}) =>
  `<p class="${muted ? 's-muted' : 's-text'}" style="margin:${margin};font-family:${FONT};font-size:${size}px;line-height:1.6;color:${muted ? LIGHT.muted : LIGHT.text}">${html}</p>`;

const link = (href, label) =>
  `<a class="s-brand" href="${escapeHtml(href)}" style="color:${LIGHT.brand};text-decoration:underline">${label}</a>`;

// A table cell carries the fill so Outlook, which ignores padding on links,
// still draws a button (square there: it ignores border-radius too).
const buttonHtml = ({ href, label }) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px">
<tr><td class="s-button" bgcolor="${LIGHT.brand}" style="border-radius:999px;background:${LIGHT.brand};box-shadow:${raisedSmall(LIGHT)}">
<a class="s-label" href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:600;line-height:20px;color:${LIGHT.label};text-decoration:none;border-radius:999px">${escapeHtml(label)}</a>
</td></tr>
</table>`;

const wellHtml = (html) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px">
<tr><td class="s-well" style="padding:14px 16px;border-radius:12px;background:${LIGHT.surface};box-shadow:${insetWell(LIGHT)}">
${para(html, { muted: true, size: 14, margin: '0' })}
</td></tr>
</table>`;

/**
 * One card on the app's surface: the SLICs wordmark, a heading, the message,
 * a button with its note in an inset well, then the quieter lines.
 * `preview` is the inbox's preview line; `copyLink` adds the button's URL as
 * text for mail apps that break buttons.
 */
function layout({ subject, preview, heading, firstName, paragraphs, button, copyLink, note, footer, origin }) {
  const host = new URL(origin).host;
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<style>${STYLE}</style>
</head>
<body class="s-surface" style="margin:0;padding:0;background:${LIGHT.surface};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preview)}${'&#847;&zwnj;&nbsp;'.repeat(40)}</div>
<table role="presentation" class="s-surface" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${LIGHT.surface}" style="background:${LIGHT.surface}">
<tr><td class="s-outer" align="center" style="padding:40px 16px">
<!--[if mso]><table role="presentation" width="${WIDTH}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${WIDTH}px">
<tr><td align="center" style="padding:0 0 24px">
<a class="s-brand" href="${escapeHtml(origin)}" style="font-family:${FONT};font-size:22px;font-weight:800;letter-spacing:-0.02em;color:${LIGHT.brand};text-decoration:none">SLICs</a>
</td></tr>
<tr><td class="s-card s-pad" style="padding:36px 32px;border-radius:16px;background:${LIGHT.surface};box-shadow:${raised(LIGHT)}">
<h1 class="s-text" style="margin:0 0 20px;font-family:${FONT};font-size:24px;font-weight:700;line-height:1.3;letter-spacing:-0.01em;color:${LIGHT.text}">${escapeHtml(heading)}</h1>
${para(escapeHtml(greeting(firstName)))}
${paragraphs.map((html) => para(html)).join('\n')}
${buttonHtml(button)}
${note ? wellHtml(note) : ''}
${copyLink ? para(`Button not working? Copy this link into your browser:<br>${link(button.href, `<span style="word-break:break-all">${escapeHtml(button.href)}</span>`)}`, { muted: true, size: 13, margin: '0 0 16px' }) : ''}
${footer.map((html, i) => para(html, { muted: true, size: 14, margin: i === footer.length - 1 ? '0' : '0 0 12px' })).join('\n')}
</td></tr>
<tr><td align="center" style="padding:24px 0 0">
${para(`SLICs · ${link(origin, escapeHtml(host))}`, { muted: true, size: 13, margin: '0' })}
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
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
    subject,
    preview: `Choose a new password. The link works once, for ${minutes} minutes.`,
    heading: 'Reset your password',
    firstName,
    origin,
    paragraphs: [
      'Someone asked to reset the password for your SLICs account. If it was you, tap the button to choose a new password.',
    ],
    button: { href: url, label: 'Choose a new password' },
    copyLink: true,
    note: `The link works once, for ${minutes} minutes. After that, ask for a new one on the sign-in page.`,
    footer: ["If it wasn't you, ignore this email. Your password stays the same."],
  });
  return { subject, text, html };
}

/** For an account that signs in with Google: there's no password to reset. */
export function googleAccountEmail({ firstName, origin }) {
  const signInUrl = `${origin}/sign-in`;
  const recoveryUrl = 'https://accounts.google.com/signin/recovery';
  const subject = 'How you sign in to SLICs';
  const text = [
    greeting(firstName),
    'Someone asked to reset the password for your SLICs account. Your account signs in with Google, so it has no SLICs password.',
    `To sign in, tap "Continue with Google" on ${signInUrl}`,
    `If you can't get into your Google account, Google can help: ${recoveryUrl}`,
    "If it wasn't you, ignore this email. Nothing has changed.",
    `SLICs · ${origin}`,
  ].join('\n\n');
  const html = layout({
    subject,
    preview: 'Your account signs in with Google, so it has no SLICs password.',
    heading: 'You sign in with Google',
    firstName,
    origin,
    paragraphs: [
      'Someone asked to reset the password for your SLICs account. Your account signs in with Google, so it has no SLICs password.',
      'To sign in, tap <strong>Continue with Google</strong> on the sign-in page.',
    ],
    button: { href: signInUrl, label: 'Go to sign-in' },
    note: `If you can't get into your Google account, ${link(recoveryUrl, 'Google can help')}.`,
    footer: ["If it wasn't you, ignore this email. Nothing has changed."],
  });
  return { subject, text, html };
}

/** The link that confirms a new password account's email (SECURITY.md #8). */
export function confirmEmailEmail({ firstName, url, hours, origin }) {
  const subject = 'Confirm your email for SLICs';
  const text = [
    greeting(firstName),
    'Thanks for making a SLICs account. Open this link to confirm this is your email address:',
    url,
    'Confirming keeps anyone else from claiming your address, and lets a Buy Me a Coffee membership find your account.',
    `The link works once, for ${hours} hours. You can send a new one from your profile.`,
    "If you didn't make a SLICs account, ignore this email.",
    `SLICs · ${origin}`,
  ].join('\n\n');
  const html = layout({
    subject,
    preview: 'Tap to confirm your email address.',
    heading: 'Confirm your email',
    firstName,
    origin,
    paragraphs: [
      'Thanks for making a SLICs account. Tap the button to confirm this is your email address.',
      'Confirming keeps anyone else from claiming your address, and lets a Buy Me a Coffee membership find your account.',
    ],
    button: { href: url, label: 'Confirm my email' },
    copyLink: true,
    note: `The link works once, for ${hours} hours. You can send a new one from your profile.`,
    footer: ["If you didn't make a SLICs account, ignore this email."],
  });
  return { subject, text, html };
}
