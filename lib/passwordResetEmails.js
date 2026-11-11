// The account emails, each as `{ subject, text, html }` for lib/email.js: the
// two "Forgot your password?" sends (docs/PASSWORD-RESET.md stage 3), and the
// link that confirms a password account's email (docs/SECURITY.md #8). Plain
// on purpose: the app icon only, no web fonts, no tracking, one link. The reset ones
// say only that someone asked, never who.
//
// The look is lib/emailLayout.js, shared with the emails the super admin
// writes on /admin/super/email.

import { emailLayout as layout, emailLink as link, greeting } from '@/lib/emailLayout';

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
