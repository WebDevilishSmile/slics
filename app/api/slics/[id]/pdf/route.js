import { requireArea } from '@/lib/authz';
import { ObjectId } from 'mongodb';
import { after, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/httpError';
import { getSlicById, updateSlic } from '@/lib/db/slics';
import { notifySlicEdit } from '@/lib/pushEvents';
import { deleteSlicPdf, putSlicPdf } from '@/lib/blob';
import { SLIC_PDF_MAX_BYTES } from '@/constants';

// `[id]` is the slic's MongoDB _id, same as the parent route's methods.

function isPdfFile(file) {
  // Browsers occasionally send an empty type for PDFs, so accept the
  // extension too — the same rule BidSheetUploader.jsx uses.
  return (
    file.type === 'application/pdf' ||
    file.name?.toLowerCase().endsWith('.pdf')
  );
}

// POST: upload (or replace) the PDF for a slic
export async function POST(request, { params }) {
  const { session, denied } = await requireArea('slics');
  if (denied) return denied;

  const { id } = await params;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });
  }

  let file;
  try {
    const formData = await request.formData();
    file = formData.get('file');
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart form data with a "file" field' },
      { status: 400 },
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'A PDF file is required' }, { status: 400 });
  }

  if (!isPdfFile(file)) {
    return NextResponse.json(
      { error: 'Only PDF files are accepted' },
      { status: 400 },
    );
  }

  if (file.size > SLIC_PDF_MAX_BYTES) {
    return NextResponse.json(
      {
        error: `PDF is too large (max ${SLIC_PDF_MAX_BYTES / (1024 * 1024)}MB)`,
      },
      { status: 400 },
    );
  }

  try {
    const slic = await getSlicById(id);
    const previousUrl = slic.pdfUrl || null;

    const { url } = await putSlicPdf(slic.alphaSlic, file);

    await updateSlic(id, { pdfUrl: url }, session.user);
    after(() => notifySlicEdit({ numSlic: slic.numSlic, action: 'pdf', except: session.user.id }));

    // Only after the new URL is saved, so a failed save never orphans the slic
    // pointing at a deleted blob.
    if (previousUrl && previousUrl !== url) {
      await deleteSlicPdf(previousUrl);
    }

    return NextResponse.json({ pdfUrl: url });
  } catch (error) {
    console.error('Error uploading slic PDF:', error);
    return errorResponse(error, "Couldn't upload the PDF. Please try again.");
  }
}

// DELETE: remove the PDF from a slic
export async function DELETE(request, { params }) {
  const { session, denied } = await requireArea('slics');
  if (denied) return denied;

  const { id } = await params;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });
  }

  try {
    const slic = await getSlicById(id);
    const previousUrl = slic.pdfUrl || null;

    const { changed } = await updateSlic(id, { pdfUrl: null }, session.user);
    await deleteSlicPdf(previousUrl);
    if (changed) {
      after(() => notifySlicEdit({ numSlic: slic.numSlic, action: 'pdf', except: session.user.id }));
    }

    return NextResponse.json({ message: 'Slic PDF removed successfully' });
  } catch (error) {
    console.error('Error removing slic PDF:', error);
    return errorResponse(error, "Couldn't remove the PDF. Please try again.");
  }
}
