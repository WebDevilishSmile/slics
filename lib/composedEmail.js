import { COMPOSE_EMAIL_LIMITS as LIMITS, COMPOSE_EMAIL_MAX_RECIPIENTS } from '@/constants';
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
 * The address a mail app shows: `"Jane Doe" <jane@example.com>`, or the bare
 * address with no name. Quotes, angle brackets and line breaks are taken out
 * of the name so it can't change the header.
 */
export function addressWithName(name, email) {
  const clean = String(name ?? '')
    .replace(/["<>\\\r\n]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  return clean ? `"${clean}" <${email}>` : email;
}

/** Whether a string is one email address (no name, no list). */
export const isEmailAddress = (value) =>
  typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);

// The groups the compose form can pick at once, for the Sent list's wording.
export const RECIPIENT_GROUPS = { everyone: 'Everyone', admins: 'Admins', dispatch: 'Dispatch' };

/**
 * Checks the compose form. → `{ value }` with every field trimmed, or
 * `{ error }`, a sentence to show. The browser and the server both call it.
 * `recipients` is the list of addresses (each gets their own copy); an old
 * draft's single `to` still works. `value.to` is the first address.
 */
export function validateComposedEmail(input) {
  const typed = Array.isArray(input?.recipients) ? input.recipients : [input?.to];
  const recipients = [];
  for (const raw of typed) {
    const address = trim(raw).toLowerCase();
    if (!address) continue;
    if (!isEmailAddress(address)) {
      return { error: `“${address.slice(0, 60)}” doesn’t look like an email address. Fix it or remove it.` };
    }
    if (!recipients.includes(address)) recipients.push(address);
  }
  const value = {
    recipients,
    to: recipients[0] ?? '',
    group: Object.hasOwn(RECIPIENT_GROUPS, input?.group) ? input.group : null,
    subject: trim(input?.subject).replace(/\s+/g, ' '),
    heading: trim(input?.heading).replace(/\s+/g, ' '),
    message: tidy(input?.message),
    buttonLabel: trim(input?.buttonLabel).replace(/\s+/g, ' '),
    buttonUrl: trim(input?.buttonUrl),
    note: tidy(input?.note),
    signOff: tidy(input?.signOff),
    copyMe: input?.copyMe !== false,
  };

  if (!recipients.length) return { error: 'Who is it to? Pick someone or enter an email address.' };
  if (recipients.length > COMPOSE_EMAIL_MAX_RECIPIENTS) {
    return {
      error: `That’s ${recipients.length} people. One email goes to ${COMPOSE_EMAIL_MAX_RECIPIENTS} at most: Resend’s free plan sends 100 a day, password and sign-up emails included.`,
    };
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
