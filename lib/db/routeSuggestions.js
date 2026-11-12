import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { getRoute, saveRoute } from '@/lib/db/slicRoutes';
import { DEFAULT_HUB_ID } from '@/lib/hubScope';
import { ROUTE_NOTE_MAX_LENGTH, normalizeRouteText, validateRouteText } from '@/lib/routeText';

// Drivers' suggested routes (docs/SLIC-DIRECTIONS.md, stage 2): a driver
// proposes directions for a SLIC, or a change to them, and an admin with the
// SLICs area approves (it becomes the route, through saveRoute) or declines
// with an answer the driver sees.
//   { hubId, numSlic, userId: ObjectId|null, text, note, status: 'open' |
//     'approved' | 'declined', answer, decidedBy: { id, name }, decidedAt,
//     created_at, updated_at }
// Per hub: a route is the way from one building (MULTI-HUB.md). One open
// suggestion per driver per SLIC: sending again replaces it. Plain text,
// never HTML. Suggesters' ids never leave the server; the queue shows names.
const SUGGESTIONS = 'route-suggestions';
const suggestions = () => client.db().collection(SUGGESTIONS);
const CLOSED_SHOWN = 20;

const now = () => new Date().toISOString();

function cleanNote(value) {
  return normalizeRouteText(typeof value === 'string' ? value : '').slice(0, ROUTE_NOTE_MAX_LENGTH);
}

// → { suggestion: { numSlic, text, note } } or { error }.
export function validateRouteSuggestion(body) {
  const numSlic = typeof body?.numSlic === 'string' ? body.numSlic.trim() : '';
  if (!/^[A-Za-z0-9]{1,12}$/.test(numSlic)) return { error: 'Which SLIC?' };
  const { text, error } = validateRouteText(body?.text);
  if (error) return { error };
  return { suggestion: { numSlic, text, note: cleanNote(body?.note) } };
}

// → { notFound } | { id, updated }. A driver's open suggestion for the SLIC
// is replaced rather than piled up.
export async function createRouteSuggestion({ numSlic, text, note, userId }) {
  const slic = await client.db().collection('slics').findOne({ numSlic }, { projection: { _id: 1 } });
  if (!slic) return { notFound: true };

  const owner = new ObjectId(userId);
  const existing = await suggestions().findOneAndUpdate(
    { numSlic, userId: owner, status: 'open' },
    { $set: { text, note, updated_at: now() } },
    { projection: { _id: 1 } },
  );
  if (existing) return { id: existing._id, updated: true };

  const { insertedId } = await suggestions().insertOne({
    hubId: DEFAULT_HUB_ID,
    numSlic,
    userId: owner,
    text,
    note,
    status: 'open',
    answer: null,
    created_at: now(),
  });
  return { id: insertedId };
}

// The driver's own latest suggestion for a SLIC, for the directions sheet:
// what they sent and what became of it. → null or { status, text, note,
// answer, created_at, updated_at, decidedAt }.
export async function getMyRouteSuggestion(userId, numSlic) {
  const doc = await suggestions().findOne(
    { userId: new ObjectId(userId), numSlic },
    { sort: { created_at: -1 } },
  );
  if (!doc) return null;
  return {
    status: doc.status,
    text: doc.text,
    note: doc.note || '',
    answer: doc.answer || '',
    created_at: doc.created_at,
    updated_at: doc.updated_at ?? null,
    decidedAt: doc.decidedAt ?? null,
  };
}

async function namesFor(userIds) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))].map((id) => new ObjectId(id));
  if (!ids.length) return new Map();
  const users = await client.db().collection('users').find({ _id: { $in: ids } }, { projection: { name: 1 } }).toArray();
  return new Map(users.map((user) => [user._id.toString(), user.name || 'A driver']));
}

async function slicLabels(numSlics) {
  const slics = await client
    .db()
    .collection('slics')
    .find({ numSlic: { $in: [...new Set(numSlics)] } }, { projection: { numSlic: 1, alphaSlic: 1, name: 1, type: 1 } })
    .toArray();
  return new Map(
    slics.map((slic) => [slic.numSlic, (slic.type === 'customer' ? slic.name : slic.alphaSlic) || slic.alphaSlic || null]),
  );
}

// For the queue: names, never ids, and each open one's current route beside it.
async function shape(docs, { withCurrent = false } = {}) {
  const [names, labels] = await Promise.all([
    namesFor(docs.map((doc) => doc.userId)),
    slicLabels(docs.map((doc) => doc.numSlic)),
  ]);
  const current = new Map();
  if (withCurrent) {
    for (const numSlic of new Set(docs.map((doc) => doc.numSlic))) {
      current.set(numSlic, (await getRoute(numSlic))?.text ?? null);
    }
  }
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    numSlic: doc.numSlic,
    slicLabel: labels.get(doc.numSlic) ?? null,
    text: doc.text,
    note: doc.note || '',
    status: doc.status,
    answer: doc.answer || '',
    suggestedBy: doc.userId ? (names.get(doc.userId.toString()) ?? null) : null,
    currentText: withCurrent ? (current.get(doc.numSlic) ?? null) : undefined,
    created_at: doc.created_at,
    updated_at: doc.updated_at ?? null,
    decidedAt: doc.decidedAt ?? null,
    decidedBy: doc.decidedBy?.name ?? null,
  }));
}

// The admin queue: open ones oldest first, then the last few decided.
export async function getRouteSuggestions() {
  const [open, closed] = await Promise.all([
    suggestions().find({ status: 'open' }).sort({ created_at: 1 }).toArray(),
    suggestions().find({ status: { $ne: 'open' } }).sort({ decidedAt: -1 }).limit(CLOSED_SHOWN).toArray(),
  ]);
  return { open: await shape(open, { withCurrent: true }), closed: await shape(closed) };
}

// For the /admin banner and the header badge: { count, slics: [label] }.
export async function getOpenRouteSuggestionSummary() {
  const rows = await suggestions().find({ status: 'open' }, { projection: { numSlic: 1 } }).toArray();
  const counts = new Map();
  for (const row of rows) counts.set(row.numSlic, (counts.get(row.numSlic) ?? 0) + 1);
  const labels = await slicLabels([...counts.keys()]);
  const slics = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([numSlic]) => labels.get(numSlic) ?? numSlic);
  return { count: rows.length, slics };
}

const toObjectId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

// Approves an open suggestion: `text` (the suggestion as the admin left it)
// becomes the SLIC's route through saveRoute, versions and history included.
// → { suggestion, changed } or { error, status }.
export async function approveRouteSuggestion(id, text, actor) {
  const _id = toObjectId(id);
  if (!_id) return { error: 'That suggestion is gone.', status: 404 };
  const doc = await suggestions().findOne({ _id });
  if (!doc) return { error: 'That suggestion is gone.', status: 404 };
  if (doc.status !== 'open') return { error: 'That suggestion was already decided.', status: 409 };
  const checked = validateRouteText(text ?? doc.text);
  if (checked.error) return { error: checked.error, status: 400 };

  const { changed } = await saveRoute({ numSlic: doc.numSlic, text: checked.text, source: 'suggestion', user: actor });
  await suggestions().updateOne(
    { _id },
    { $set: { status: 'approved', decidedAt: now(), decidedBy: { id: actor.id, name: actor.name ?? null } } },
  );
  const [suggestion] = await shape([await suggestions().findOne({ _id })]);
  return { suggestion, changed };
}

// → { suggestion } or { error, status }.
export async function declineRouteSuggestion(id, answer, actor) {
  const _id = toObjectId(id);
  if (!_id) return { error: 'That suggestion is gone.', status: 404 };
  const result = await suggestions().findOneAndUpdate(
    { _id, status: 'open' },
    {
      $set: {
        status: 'declined',
        answer: cleanNote(answer),
        decidedAt: now(),
        decidedBy: { id: actor.id, name: actor.name ?? null },
      },
    },
    { returnDocument: 'after' },
  );
  if (!result) return { error: 'That suggestion was already decided or is gone.', status: 409 };
  const [suggestion] = await shape([result]);
  return { suggestion };
}

// For the audit row a delete writes first: what it was, never the text.
export async function getRouteSuggestionSummary(id) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await suggestions().findOne({ _id }, { projection: { numSlic: 1, status: 1, created_at: 1 } });
  if (!doc) return null;
  return { _id: doc._id, text: `SLIC ${doc.numSlic} · ${doc.status} · ${String(doc.created_at).slice(0, 10)}` };
}

export async function deleteRouteSuggestion(id) {
  const _id = toObjectId(id);
  if (!_id) return false;
  const { deletedCount } = await suggestions().deleteOne({ _id });
  return deletedCount > 0;
}

// Account deletion: suggestions stay, about the SLIC, no longer linked.
export async function unlinkUserRouteSuggestions(userId) {
  const { modifiedCount } = await suggestions().updateMany(
    { userId: new ObjectId(userId) },
    { $set: { userId: null } },
  );
  return { unlinkedRouteSuggestions: modifiedCount };
}
