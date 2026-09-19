// Vercel Blob client for slic PDFs. Like lib/db.ts this is the single place
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
