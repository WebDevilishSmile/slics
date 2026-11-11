import { COMPOSE_EMAIL_LIMITS as LIMITS } from '@/constants';
import { emailLayout, emailLink, escapeHtml } from '@/lib/emailLayout';

// An email the super admin writes on /admin/super/email, in the same look as
// the account emails (lib/emailLayout.js). Pure: the compose page renders its
// preview with these in the browser, and POST /api/emails checks and renders
// the same fields again on the server before sending, so what's previewed is
// what goes out.
//
// Everything typed is plain text. It's escaped, never read as HTML; a blank
// line starts a new paragraph, a line break stays a line break, and a web
// address becomes a link.

const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+$/;
const URL_RE = /https?:\/\/[^\s<>"]+/g;
// Punctuation that ends a sentence, not the address.
const TRAILING_RE = /[.,;:!?)\]}'"]+$/;

const trim = (value) => (typeof value === 'string' ? value.trim() : '');
// Line breaks kept, Windows ones made plain, trailing spaces dropped.
const tidy = (value) =>
  trim(value)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n');

/** Text with its web addresses as links, escaped. */
function linkify(text) {
  let html = '';
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    let url = match[0];
    const tail = url.match(TRAILING_RE)?.[0] ?? '';
    if (tail) url = url.slice(0, -tail.length);
    html += escapeHtml(text.slice(last, match.index));
    html += emailLink(url, escapeHtml(url));
    last = match.index + url.length;
  }
  return html + escapeHtml(text.slice(last));
}

const paragraphsOf = (text) => text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
const htmlOf = (paragraph) => linkify(paragraph).replaceAll('\n', '<br>');

function httpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Checks the compose form. → `{ value }` with every field trimmed, or
 * `{ error }`, a sentence to show. The browser and the server both call it.
 */
export function validateComposedEmail(input) {
  const value = {
    to: trim(input?.to).toLowerCase(),
    subject: trim(input?.subject).replace(/\s+/g, ' '),
    heading: trim(input?.heading).replace(/\s+/g, ' '),
    message: tidy(input?.message),
    buttonLabel: trim(input?.buttonLabel).replace(/\s+/g, ' '),
    buttonUrl: trim(input?.buttonUrl),
    note: tidy(input?.note),
    signOff: tidy(input?.signOff),
    copyMe: input?.copyMe !== false,
  };

  if (!value.to) return { error: 'Who is it to? Enter an email address.' };
  if (value.to.length > 254 || !EMAIL_RE.test(value.to)) {
    return { error: 'That email address doesn’t look right. Send it to one address.' };
  }
  if (!value.subject) return { error: 'Give it a subject.' };
  if (!value.message) return { error: 'Write the message.' };

  for (const [field, label] of [
    ['subject', 'subject'],
    ['heading', 'heading'],
    ['message', 'message'],
    ['buttonLabel', 'button’s words'],
    ['buttonUrl', 'button’s link'],
    ['note', 'note'],
    ['signOff', 'sign-off'],
  ]) {
    if (value[field].length > LIMITS[field]) {
      return { error: `Keep the ${label} to ${LIMITS[field].toLocaleString('en-US')} characters or fewer.` };
    }
  }

  if (value.buttonLabel || value.buttonUrl) {
    if (!value.buttonLabel || !value.buttonUrl) {
      return { error: 'A button needs both its words and its link, or neither.' };
    }
    const href = httpsUrl(value.buttonUrl);
    if (!href) return { error: 'The button’s link must be a full web address starting with https://.' };
    value.buttonUrl = href;
  }

  return { value };
}

/**
 * The email as `{ subject, text, html }` for lib/email.js, from fields
 * validateComposedEmail passed. `origin` is the site the wordmark links to
 * (SITE_URL). It renders whatever it's given, so the preview can show a
 * half-written email.
 */
export function composedEmail(
  { subject = '', heading = '', message = '', buttonLabel = '', buttonUrl = '', note = '', signOff = '' },
  { origin },
) {
  const paragraphs = paragraphsOf(tidy(message));
  const button = buttonLabel && buttonUrl ? { label: buttonLabel, href: buttonUrl } : null;
  const signOffLines = tidy(signOff).split('\n').filter(Boolean);
  const noteText = tidy(note);
  const firstLine = paragraphs.join(' ').replace(/\s+/g, ' ');

  const text = [
    heading,
    ...paragraphs,
    button ? `${button.label}: ${button.href}` : '',
    noteText,
    signOffLines.join('\n'),
    `SLICs · ${origin}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const html = emailLayout({
    subject,
    preview: firstLine.length > 110 ? `${firstLine.slice(0, 109)}…` : firstLine,
    heading,
    greet: false,
    paragraphs: paragraphs.map(htmlOf),
    button,
    copyLink: Boolean(button),
    note: noteText ? htmlOf(noteText) : null,
    signOff: signOffLines.map(linkify),
    origin,
  });

  return { subject, text, html };
}
