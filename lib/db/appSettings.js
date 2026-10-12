import { revalidateTag, unstable_cache } from 'next/cache';

import { COVERS_OPEN, ICON_CHANGED_AT, PLACES_NEW_UNTIL } from '@/constants';
import { recordAdminAction } from '@/lib/db/adminAudit';
import client from '@/lib/db/client';

// Feature switches the super admin flips on /admin/super/features without a
// deploy (docs/SUPER-ADMIN-HUB.md stage F). One document in `app-settings`:
//   { _id: 'features', coversOpen, placesNewUntil, iconChangedAt,
//     changed: { [key]: { at, by: { id, name } } }, updatedAt }
// The constants.js values are the defaults: a missing document or field uses
// them, so deleting the document is the rollback. A failed read uses them too,
// so Covers fails closed.
//
// Reads are cached across requests for FEATURES_TTL_SECONDS and dropped on
// every change (`revalidateTag`). auth.js puts `coversOpen` and
// `placesNewUntil` on every session (`session.features`), so `canUseCovers`
// (lib/authz.js) stays a synchronous check; a change reaches each driver on
// their next request.

export const FEATURE_DEFAULTS = {
  coversOpen: COVERS_OPEN,
  placesNewUntil: PLACES_NEW_UNTIL,
  iconChangedAt: ICON_CHANGED_AT,
};

// What /admin/super/features and the audit trail call each switch.
export const FEATURE_LABELS = {
  coversOpen: 'Covers for every driver',
  placesNewUntil: 'Places "New" label',
  iconChangedAt: 'New-icon notice',
};

const FEATURES_TTL_SECONDS = 300;
const TAG = 'app-features';
const settings = () => client.db().collection('app-settings');

const isIso = (value) => typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

async function readFeatures() {
  const doc = await settings().findOne({ _id: 'features' });
  return {
    coversOpen: typeof doc?.coversOpen === 'boolean' ? doc.coversOpen : FEATURE_DEFAULTS.coversOpen,
    placesNewUntil: isIso(doc?.placesNewUntil) ? doc.placesNewUntil : FEATURE_DEFAULTS.placesNewUntil,
    iconChangedAt: isIso(doc?.iconChangedAt) ? doc.iconChangedAt : FEATURE_DEFAULTS.iconChangedAt,
    // Which switches differ from the code's defaults because of a saved value.
    saved: {
      coversOpen: typeof doc?.coversOpen === 'boolean',
      placesNewUntil: isIso(doc?.placesNewUntil),
      iconChangedAt: isIso(doc?.iconChangedAt),
    },
    changed: doc?.changed ?? {},
  };
}

const cachedFeatures = unstable_cache(readFeatures, [TAG], {
  tags: [TAG],
  revalidate: FEATURES_TTL_SECONDS,
});

// Never throws: the defaults stand in for a failed read.
export async function getFeatures() {
  try {
    return await cachedFeatures();
  } catch (error) {
    console.error('Error reading feature switches; using the defaults:', error);
    return { ...FEATURE_DEFAULTS, saved: {}, changed: {} };
  }
}

// What every session carries (auth.js): only what the menu and the Covers gate
// need, never who changed it.
export async function getSessionFeatures() {
  const { coversOpen, placesNewUntil } = await getFeatures();
  return { coversOpen, placesNewUntil };
}

// The features page reads past the cache, so it shows what's saved.
export async function getFeaturesFresh() {
  return readFeatures();
}

// `value` as the page sends it → { value } to save, or { error }.
//   coversOpen: true | false
//   placesNewUntil: a date (ISO), from a year ago to a year ahead; "End now"
//     sends now
//   iconChangedAt: 'now' only ("Ask again"), since the notice compares it with
//     each driver's dismissal and only a newer time asks again
export function validateFeature(key, value) {
  const now = Date.now();
  const YEAR_MS = 366 * 24 * 60 * 60 * 1000;
  switch (key) {
    case 'coversOpen':
      return typeof value === 'boolean' ? { value } : { error: 'Covers is on or off.' };
    case 'placesNewUntil': {
      if (!isIso(value)) return { error: 'Choose a date.' };
      const time = new Date(value).getTime();
      if (time < now - YEAR_MS || time > now + YEAR_MS) {
        return { error: 'Choose a date within a year of today.' };
      }
      return { value: new Date(time).toISOString() };
    }
    case 'iconChangedAt':
      return value === 'now' ? { value: new Date(now).toISOString() } : { error: 'Only "now" is allowed.' };
    default:
      return { error: 'Unknown setting.' };
  }
}

// Saves one switch, writing admin_audit first like every consequential admin
// change, then drops the cache. `value` has been through validateFeature.
// → the features as getFeaturesFresh returns them.
export async function setFeature(key, value, actor) {
  const current = await readFeatures();
  if (current[key] === value && current.saved[key]) return current;

  await recordAdminAction({
    actor,
    action: 'feature.changed',
    targetType: 'feature',
    targetId: key,
    targetName: FEATURE_LABELS[key],
    from: String(current[key]),
    to: String(value),
  });
  const at = new Date().toISOString();
  await settings().updateOne(
    { _id: 'features' },
    {
      $set: {
        [key]: value,
        [`changed.${key}`]: { at, by: { id: actor?.id ?? null, name: actor?.name ?? null } },
        updatedAt: at,
      },
    },
    { upsert: true },
  );
  revalidateTag(TAG);
  return readFeatures();
}
