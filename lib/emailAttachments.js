import { detectDocumentType } from '@/lib/slicDocumentFile';

// Files attached to an email the super admin writes on /admin/super/email
// (POST /api/emails). Pure, so the compose form and the server check them
// the same way.
//
// How a file travels: the browser uploads it straight to Vercel Blob under
// `email-attachments/` (POST /api/emails/attachments hands out the upload
// token), because a request to the app can't carry more than 4.5 MB. Sending
// passes the blob's URL; the server reads the file back from Blob, checks its
// first bytes, and gives Resend the file itself. The blob is deleted once the
// email is sent, and the daily cron deletes any left behind (a removed file,
// a closed tab).

export const EMAIL_ATTACHMENT_PREFIX = 'email-attachments/';
export const EMAIL_ATTACHMENTS_MAX = 10;
// Every file together. Resend takes 40 MB per email once the files are
// base64 (a third bigger), so 20 MB leaves room for the message.
export const EMAIL_ATTACHMENTS_MAX_BYTES = 20 * 1024 * 1024;
export const EMAIL_ATTACHMENT_NAME_MAX_LENGTH = 100;

// What can be attached, by the name's extension. `signature` is the family
// its first bytes must belong to (detectAttachment below).
const KINDS = {
  pdf: { contentType: 'application/pdf', signature: 'pdf' },
  jpg: { contentType: 'image/jpeg', signature: 'jpeg' },
  jpeg: { contentType: 'image/jpeg', signature: 'jpeg' },
  png: { contentType: 'image/png', signature: 'png' },
  webp: { contentType: 'image/webp', signature: 'webp' },
  docx: {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    signature: 'zip',
  },
  xlsx: {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    signature: 'zip',
  },
  pptx: {
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    signature: 'zip',
  },
  doc: { contentType: 'application/msword', signature: 'ole' },
};

// For the file picker's `accept`.
export const EMAIL_ATTACHMENT_ACCEPT = Object.entries(KINDS)
  .flatMap(([ext, kind]) => [`.${ext}`, kind.contentType])
  .filter((value, index, all) => all.indexOf(value) === index)
  .join(',');
export const EMAIL_ATTACHMENT_CONTENT_TYPES = [...new Set(Object.values(KINDS).map((kind) => kind.contentType))];
export const EMAIL_ATTACHMENT_KINDS_LABEL = 'PDFs, photos (JPG, PNG, WebP) and Word, Excel or PowerPoint files';

const extensionOf = (name) => {
  const match = /\.([a-z0-9]+)$/i.exec(String(name ?? ''));
  return match ? match[1].toLowerCase() : '';
};

/** The kind of file a name says it is: `{ ext, contentType, signature }` or null. */
export function attachmentKind(name) {
  const ext = extensionOf(name);
  const kind = KINDS[ext];
  return kind ? { ext, ...kind } : null;
}

/**
 * A file's name as the email shows it: one line, no folders, no characters
 * mail apps or file systems choke on, at most 100 characters with its
 * extension kept. → '' when nothing is left.
 */
export function cleanAttachmentName(name) {
  const base = String(name ?? '')
    .split(/[\\/]/)
    .pop()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '');
  if (base.length <= EMAIL_ATTACHMENT_NAME_MAX_LENGTH) return base;
  const ext = extensionOf(base);
  const keep = EMAIL_ATTACHMENT_NAME_MAX_LENGTH - (ext ? ext.length + 1 : 0);
  return `${base.slice(0, keep).trimEnd()}${ext ? `.${ext}` : ''}`;
}

/** Where a file is uploaded in Blob (a random suffix is added after). */
export function attachmentPathname(name) {
  const kind = attachmentKind(name);
  const stem =
    cleanAttachmentName(name)
      .replace(/\.[a-z0-9]+$/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'file';
  return `${EMAIL_ATTACHMENT_PREFIX}${stem}.${kind?.ext ?? 'bin'}`;
}

/** Bytes for people: "840 KB", "3.2 MB". */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Checks the attachments a compose form sends: `[{ url, name, size }]`.
 * → `{ value }` with each name cleaned, or `{ error }`, a sentence to show.
 * It doesn't check the URL is this app's Blob store; the server does that
 * (isOwnBlobUrl, lib/blob.js) before reading anything.
 */
export function validateAttachments(input) {
  if (input === undefined || input === null) return { value: [] };
  if (!Array.isArray(input)) return { error: 'The attachments didn’t come through. Attach them again.' };
  if (input.length > EMAIL_ATTACHMENTS_MAX) {
    return { error: `Attach at most ${EMAIL_ATTACHMENTS_MAX} files.` };
  }

  const value = [];
  let total = 0;
  for (const item of input) {
    const name = cleanAttachmentName(item?.name);
    const url = typeof item?.url === 'string' ? item.url : '';
    const size = Number(item?.size);
    if (!name || !url.startsWith('https://') || !Number.isInteger(size) || size <= 0) {
      return { error: 'An attachment didn’t come through. Remove it and attach it again.' };
    }
    if (!attachmentKind(name)) {
      return { error: `“${name}” can’t be attached. Attach ${EMAIL_ATTACHMENT_KINDS_LABEL}.` };
    }
    total += size;
    value.push({ url, name, size });
  }
  if (total > EMAIL_ATTACHMENTS_MAX_BYTES) {
    return { error: `The files come to ${formatBytes(total)}. Keep them under ${formatBytes(EMAIL_ATTACHMENTS_MAX_BYTES)} together.` };
  }
  return { value };
}

const startsWith = (bytes, signature) => signature.every((byte, index) => bytes[index] === byte);

function signatureOf(bytes) {
  const found = detectDocumentType(bytes);
  if (found?.ext === 'pdf') return 'pdf';
  if (found?.ext === 'jpg') return 'jpeg';
  if (found?.ext === 'png') return 'png';
  if (found?.ext === 'webp') return 'webp';
  if (bytes?.length >= 4 && startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return 'zip'; // PK.. (docx, xlsx, pptx)
  if (bytes?.length >= 8 && startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'ole'; // .doc
  return null;
}

/**
 * Whether a file's first bytes are what its name says, never trusting the
 * name or the browser's word for it. → `{ filename, contentType }` for
 * Resend, or null.
 */
export function detectAttachment(bytes, name) {
  const kind = attachmentKind(name);
  if (!kind || signatureOf(bytes) !== kind.signature) return null;
  return { filename: cleanAttachmentName(name), contentType: kind.contentType };
}
