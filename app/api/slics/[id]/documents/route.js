import { ObjectId } from 'mongodb';
import { after, NextResponse } from 'next/server';

import { requireArea, requireUser } from '@/lib/authz';
import { deleteSlicDocument, putSlicDocument } from '@/lib/blob';
import { errorResponse } from '@/lib/httpError';
import { addSlicDocument, getSlicDocuments } from '@/lib/db/slicDocuments';
import { getSlicById } from '@/lib/db/slics';
import { notifySlicEdit } from '@/lib/pushEvents';
import { toAdminDocument, toDriverDocument } from '@/lib/serializers';
import {
  SLIC_DOCUMENT_MAX_BYTES,
  cleanDimension,
  detectDocumentType,
  validateDocumentTitle,
} from '@/lib/slicDocumentFile';

// A SLIC's photos and PDFs (docs/SLIC-DIRECTIONS.md, stage 3). `[id]` is the
// SLIC's _id, as everywhere under /api/slics/[id].

const badId = () => NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });

// GET — the documents, for the directions sheet: `{ documents }`.
export async function GET(request, { params }) {
  const { denied } = await requireUser();
  if (denied) return denied;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return badId();
  try {
    const slic = await getSlicById(id);
    const docs = await getSlicDocuments(slic.numSlic);
    return NextResponse.json({ documents: docs.map(toDriverDocument) });
  } catch (error) {
    console.error('Error loading slic documents:', error);
    return errorResponse(error, "Couldn't load the documents. Please try again.");
  }
}

// POST multipart `{ file, title, width?, height? }` — adds a photo or a PDF.
// What it is comes from its first bytes, never its name. A photo arrives
// already shrunk by the browser (slicForm/SlicDocuments.jsx).
export async function POST(request, { params }) {
  const { session, denied } = await requireArea('slics');
  if (denied) return denied;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return badId();

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Send the file as a form upload.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Choose a photo or a PDF.' }, { status: 400 });
  }
  if (file.size > SLIC_DOCUMENT_MAX_BYTES) {
    return NextResponse.json({ error: 'That file is too large (4 MB at most).' }, { status: 400 });
  }
  const { title, error: titleError } = validateDocumentTitle(form.get('title'));
  if (titleError) return NextResponse.json({ error: titleError }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectDocumentType(bytes);
  if (!type) {
    return NextResponse.json(
      { error: 'That isn’t a photo (JPEG, PNG or WebP) or a PDF.' },
      { status: 400 },
    );
  }

  let url = null;
  try {
    const slic = await getSlicById(id);
    ({ url } = await putSlicDocument(slic.alphaSlic || slic.numSlic, title, bytes, type));
    const doc = await addSlicDocument({
      slic,
      title,
      kind: type.kind,
      url,
      contentType: type.contentType,
      width: type.kind === 'image' ? cleanDimension(form.get('width')) : null,
      height: type.kind === 'image' ? cleanDimension(form.get('height')) : null,
      bytes: bytes.length,
      user: session.user,
    });
    after(() =>
      notifySlicEdit({ numSlic: slic.numSlic, action: 'documents', except: session.user.id, byRole: session.user.role }),
    );
    return NextResponse.json({ document: toAdminDocument(doc) });
  } catch (error) {
    // The file went up but its row didn't: take the file back down.
    if (url) await deleteSlicDocument(url);
    console.error('Error adding a slic document:', error);
    return errorResponse(error, "Couldn't add the document. Please try again.");
  }
}
