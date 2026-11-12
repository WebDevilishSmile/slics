import { ObjectId } from 'mongodb';
import { after, NextResponse } from 'next/server';

import { requireArea } from '@/lib/authz';
import { deleteSlicDocument } from '@/lib/blob';
import { errorResponse } from '@/lib/httpError';
import { deleteSlicDocumentRow, moveSlicDocument, renameSlicDocument } from '@/lib/db/slicDocuments';
import { getSlicById } from '@/lib/db/slics';
import { notifySlicEdit } from '@/lib/pushEvents';
import { validateDocumentTitle } from '@/lib/slicDocumentFile';

// One of a SLIC's documents (docs/SLIC-DIRECTIONS.md, stage 3). `[id]` is the
// SLIC's _id; a document belongs to the SLIC it's asked about, or it's 404.

// PATCH `{ title }` renames it; `{ move: 'up' | 'down' }` reorders it.
export async function PATCH(request, { params }) {
  const { session, denied } = await requireArea('slics');
  if (denied) return denied;

  const { id, docId } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });

  try {
    const body = await request.json();
    const slic = await getSlicById(id);
    if (body?.move === 'up' || body?.move === 'down') {
      const result = await moveSlicDocument({ slic, docId, direction: body.move });
      return NextResponse.json(result);
    }
    const { title, error } = validateDocumentTitle(body?.title);
    if (error) return NextResponse.json({ error }, { status: 400 });
    const result = await renameSlicDocument({ slic, docId, title, user: session.user });
    if (result.changed) {
      after(() =>
        notifySlicEdit({ numSlic: slic.numSlic, action: 'documents', except: session.user.id, byRole: session.user.role }),
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error changing a slic document:', error);
    return errorResponse(error, "Couldn't save that. Please try again.");
  }
}

// DELETE — removes it, then its file.
export async function DELETE(request, { params }) {
  const { session, denied } = await requireArea('slics');
  if (denied) return denied;

  const { id, docId } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid slic ID' }, { status: 400 });

  try {
    const slic = await getSlicById(id);
    const doc = await deleteSlicDocumentRow({ slic, docId, user: session.user });
    await deleteSlicDocument(doc.url);
    after(() =>
      notifySlicEdit({ numSlic: slic.numSlic, action: 'documents', except: session.user.id, byRole: session.user.role }),
    );
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting a slic document:', error);
    return errorResponse(error, "Couldn't remove the document. Please try again.");
  }
}
