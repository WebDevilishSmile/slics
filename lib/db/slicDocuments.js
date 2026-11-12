import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { addSlicHistoryEntry } from '@/lib/db/slicHistory';
import { HttpError } from '@/lib/httpError';
import { SLIC_DOCUMENTS_MAX } from '@/lib/slicDocumentFile';

// A SLIC's extra documents (docs/SLIC-DIRECTIONS.md, stage 3): photos and
// PDFs such as a railyard map, in the order an admin set.
//   { numSlic, title, kind: 'image' | 'pdf', url (Vercel Blob, public),
//     contentType, width, height, bytes, sortOrder, uploadedBy { id, name },
//     created_at, updated_at }
// They're the destination's, the same from any hub (MULTI-HUB.md → Shared
// SLICs), so there's no hubId. Written only by the SLICs area through
// /api/slics/[id]/documents; each change is a `document` line in the SLIC's
// history.
const DOCUMENTS = 'slic-documents';
const documents = () => client.db().collection(DOCUMENTS);

const stamp = (user) => (user ? { id: user.id ?? null, name: user.name ?? null } : null);

export async function getSlicDocuments(numSlic) {
  return documents()
    .find({ numSlic: String(numSlic) })
    .sort({ sortOrder: 1, created_at: 1 })
    .toArray();
}

// The SLICs that have documents, as a Set of numSlic strings: the lookup page
// marks them, like getRouteNumSlics, so the card needs no call to know.
export async function getDocumentNumSlics() {
  const rows = await documents()
    .aggregate([{ $group: { _id: '$numSlic' } }])
    .toArray();
  return new Set(rows.map((row) => String(row._id)));
}

const history = (slic, changes, user) =>
  addSlicHistoryEntry({ slicId: slic._id, numSlic: slic.numSlic, action: 'updated', changes, user });

// `slic` is the SLIC document; the file is already in Blob. → the new doc.
export async function addSlicDocument({ slic, title, kind, url, contentType, width, height, bytes, user }) {
  const numSlic = String(slic.numSlic);
  const existing = await documents()
    .find({ numSlic }, { projection: { sortOrder: 1 } })
    .toArray();
  if (existing.length >= SLIC_DOCUMENTS_MAX) {
    throw new HttpError(400, `A SLIC can have up to ${SLIC_DOCUMENTS_MAX} documents. Remove one first.`);
  }
  const now = new Date().toISOString();
  const doc = {
    numSlic,
    title,
    kind,
    url,
    contentType,
    width: width ?? null,
    height: height ?? null,
    bytes: bytes ?? null,
    sortOrder: existing.reduce((max, row) => Math.max(max, row.sortOrder ?? 0), 0) + 1,
    uploadedBy: stamp(user),
    created_at: now,
    updated_at: now,
  };
  const { insertedId } = await documents().insertOne(doc);
  await history(slic, [{ field: 'document', from: null, to: title }], user);
  return { _id: insertedId, ...doc };
}

async function findOwn(slic, docId) {
  if (!ObjectId.isValid(docId)) throw new HttpError(404, 'That document is gone.');
  const doc = await documents().findOne({ _id: new ObjectId(docId), numSlic: String(slic.numSlic) });
  if (!doc) throw new HttpError(404, 'That document is gone.');
  return doc;
}

export async function renameSlicDocument({ slic, docId, title, user }) {
  const doc = await findOwn(slic, docId);
  if (doc.title === title) return { changed: false };
  await documents().updateOne({ _id: doc._id }, { $set: { title, updated_at: new Date().toISOString() } });
  await history(slic, [{ field: 'document', from: doc.title, to: title }], user);
  return { changed: true };
}

// Swaps the document with its neighbour above ('up') or below ('down').
export async function moveSlicDocument({ slic, docId, direction }) {
  const doc = await findOwn(slic, docId);
  const list = await getSlicDocuments(slic.numSlic);
  const index = list.findIndex((row) => row._id.equals(doc._id));
  const other = list[direction === 'up' ? index - 1 : index + 1];
  if (!other) return { changed: false };
  // Renumber the whole list in its new order, so ties from equal sortOrders
  // can't make a move do nothing.
  const order = [...list];
  [order[index], order[order.indexOf(other)]] = [other, doc];
  await documents().bulkWrite(
    order.map((row, position) => ({
      updateOne: { filter: { _id: row._id }, update: { $set: { sortOrder: position + 1 } } },
    })),
  );
  return { changed: true };
}

// → the deleted doc, so the route can remove its file.
export async function deleteSlicDocumentRow({ slic, docId, user }) {
  const doc = await findOwn(slic, docId);
  await documents().deleteOne({ _id: doc._id });
  await history(slic, [{ field: 'document', from: doc.title, to: null }], user);
  return doc;
}
