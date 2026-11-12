// Vercel Blob client for slic PDFs. Like lib/db/client.js this is the single place
// the app talks to the external store; the route handler and the migration
// script both go through it. Auth is implicit: the SDK reads
// BLOB_READ_WRITE_TOKEN, which Vercel injects once a Blob store is connected
// to the project (`vercel env pull` locally).
import { del, put } from '@vercel/blob';

// `addRandomSuffix: true` gives every upload a unique URL. Replacing a PDF is
// then "upload new, save its URL, delete the old one" — never an in-place
// overwrite, so a driver can't be served a stale copy from the CDN cache.
export async function putSlicPdf(alphaSlic, body) {
  if (!alphaSlic) {
    throw new Error('alphaSlic is required to store a slic PDF');
  }

  const pathname = `slic-pdfs/${String(alphaSlic).toLowerCase()}.pdf`;

  const blob = await put(pathname, body, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'application/pdf',
  });

  return { url: blob.url };
}

// A SLIC's extra document (docs/SLIC-DIRECTIONS.md, stage 3): a photo or a
// PDF, its type from its first bytes (lib/slicDocumentFile.js). A random
// suffix like the PDFs, so a replaced file never comes back from the CDN.
export async function putSlicDocument(alphaSlic, title, body, { contentType, ext }) {
  const slug = (value) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'doc';
  const blob = await put(`slic-docs/${slug(alphaSlic)}-${slug(title)}.${ext}`, body, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
  });
  return { url: blob.url };
}

// Best-effort, like deleteSlicPdf: the document's row is already gone.
export async function deleteSlicDocument(url) {
  if (!url) return;
  try {
    await del(url);
  } catch (error) {
    console.error(`Error deleting slic document blob ${url}:`, error);
  }
}

// Best-effort: a blob that's already gone must not block clearing the field
// or replacing the PDF, so failures are logged rather than thrown.
export async function deleteSlicPdf(url) {
  if (!url) return;

  try {
    await del(url);
  } catch (error) {
    console.error(`Error deleting slic PDF blob ${url}:`, error);
  }
}
