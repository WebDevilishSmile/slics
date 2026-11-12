// A SLIC's extra documents (docs/SLIC-DIRECTIONS.md, stage 3): photos and
// PDFs such as a railyard map. Pure and import-free, so the upload route and
// the admin's upload form check files the same way.

// Under Vercel's 4.5 MB request limit, like SLIC_PDF_MAX_BYTES. A phone photo
// is shrunk in the browser first (IMAGE_MAX_SIDE), so it fits easily.
export const SLIC_DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;
// A photo's longest side after the browser shrinks it: sharp enough to read a
// posted yard map, small enough to load on a cab's connection.
export const IMAGE_MAX_SIDE = 2400;
export const SLIC_DOCUMENTS_MAX = 12;
export const DOCUMENT_TITLE_MAX_LENGTH = 60;

const startsWith = (bytes, signature, offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

// What a file is, from its first bytes, never its name or the browser's word
// for it (SECURITY.md #13 notes the PDF route only checks the name).
// → { kind: 'image' | 'pdf', contentType, ext } or null.
export function detectDocumentType(bytes) {
  if (!bytes || bytes.length < 12) return null;
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return { kind: 'pdf', contentType: 'application/pdf', ext: 'pdf' }; // %PDF-
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { kind: 'image', contentType: 'image/jpeg', ext: 'jpg' };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: 'image', contentType: 'image/png', ext: 'png' };
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { kind: 'image', contentType: 'image/webp', ext: 'webp' }; // RIFF....WEBP
  }
  return null;
}

// → { title } or { error }. Plain text, one line.
export function validateDocumentTitle(value) {
  const title = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (!title) return { error: 'Give it a title, such as "Railyard map".' };
  if (title.length > DOCUMENT_TITLE_MAX_LENGTH) {
    return { error: `Keep the title under ${DOCUMENT_TITLE_MAX_LENGTH} characters.` };
  }
  return { title };
}

// A width or height the browser measured, or null.
export function cleanDimension(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= 20000 ? number : null;
}
