import client from '@/lib/db/client';
import { HttpError } from '@/lib/httpError';
import { addSlicHistoryEntry } from '@/lib/db/slicHistory';
import { DEFAULT_HUB_ID } from '@/lib/hubScope';
import { ROUTE_VERSIONS_KEPT } from '@/lib/routeText';

// A hub's directions to a SLIC (docs/SLIC-DIRECTIONS.md, stage 1): one doc per
// (hubId, numSlic), unique (lib/db/indexSpecs.mjs).
//   { hubId, numSlic, text, source: 'pdf-import' | 'admin' | 'suggestion',
//     importedFrom (the PDF's url, for an imported route), approvedBy { id,
//     name }, approvedAt, created_at, updated_at,
//     previous: [{ text, source, approvedBy, approvedAt }] }  newest first
// A route is the way from one building, so it's per hub (MULTI-HUB.md →
// Shared SLICs); every doc is BETPA's until stage 2 of that plan passes a hub
// in. `text` is plain text, one step per line (lib/routeText.js). Written
// only by an admin with the SLICs area, or the import script
// (scripts/importSlicRoutes.mjs).
const ROUTES = 'slic-routes';
const routes = () => client.db().collection(ROUTES);

const stamp = (user) => (user ? { id: user.id ?? null, name: user.name ?? null } : null);

export async function getRoute(numSlic) {
  return routes().findOne({ hubId: DEFAULT_HUB_ID, numSlic: String(numSlic) });
}

// The SLICs that have a route, as a Set of numSlic strings: the lookup screen
// marks them so the card shows Directions without a call per lookup.
export async function getRouteNumSlics() {
  const rows = await routes()
    .find({ hubId: DEFAULT_HUB_ID }, { projection: { _id: 0, numSlic: 1 } })
    .toArray();
  return new Set(rows.map((row) => String(row.numSlic)));
}

async function slicFor(numSlic) {
  const slic = await client
    .db()
    .collection('slics')
    .findOne({ numSlic: String(numSlic) }, { projection: { _id: 1, numSlic: 1 } });
  if (!slic) throw new HttpError(404, 'That SLIC no longer exists.');
  return slic;
}

// Saves `text` (already checked by validateRouteText) as the SLIC's route.
// The text it replaces goes to the front of `previous`, and the change is in
// the SLIC's history like any other field. → { changed }.
export async function saveRoute({ numSlic, text, source = 'admin', user }) {
  const slic = await slicFor(numSlic);
  const existing = await getRoute(slic.numSlic);
  if (existing?.text === text) return { changed: false };

  const now = new Date().toISOString();
  const fields = { text, source, approvedBy: stamp(user), approvedAt: now, updated_at: now };

  if (existing) {
    await routes().updateOne(
      { _id: existing._id },
      {
        $set: fields,
        $push: {
          previous: {
            $each: [
              {
                text: existing.text,
                source: existing.source ?? null,
                approvedBy: existing.approvedBy ?? null,
                approvedAt: existing.approvedAt ?? null,
              },
            ],
            $position: 0,
            $slice: ROUTE_VERSIONS_KEPT,
          },
        },
      },
    );
  } else {
    try {
      await routes().insertOne({
        hubId: DEFAULT_HUB_ID,
        numSlic: slic.numSlic,
        ...fields,
        importedFrom: null,
        created_at: now,
        previous: [],
      });
    } catch (error) {
      // Two saves of a new route at once: the unique index keeps one.
      if (error?.code === 11000) throw new HttpError(409, 'Someone else just saved this route. Reload and try again.');
      throw error;
    }
  }

  await addSlicHistoryEntry({
    slicId: slic._id,
    numSlic: slic.numSlic,
    action: 'updated',
    changes: [{ field: 'route', from: existing?.text ?? null, to: text }],
    user,
  });
  return { changed: true };
}

// Takes the route off the SLIC, so its card falls back to the PDF if it has
// one. The text is in the history entry, so it can be put back. → { deleted }.
export async function deleteRoute({ numSlic, user }) {
  const slic = await slicFor(numSlic);
  const existing = await getRoute(slic.numSlic);
  if (!existing) return { deleted: false };

  await routes().deleteOne({ _id: existing._id });
  await addSlicHistoryEntry({
    slicId: slic._id,
    numSlic: slic.numSlic,
    action: 'updated',
    changes: [{ field: 'route', from: existing.text, to: null }],
    user,
  });
  return { deleted: true };
}
