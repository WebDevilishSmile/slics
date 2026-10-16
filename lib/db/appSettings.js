import { revalidateTag, unstable_cache } from 'next/cache';

import {
  COVERS_OPEN,
  ICON_CHANGED_AT,
  PLACES_NEW_UNTIL,
  PUSH_OPEN,
  ROLE_AREA_DEFAULTS,
  ROLE_LABELS,
  STAFF_AREA_KEYS,
  STAFF_ROLES,
} from '@/constants';
import { recordAdminAction } from '@/lib/db/adminAudit';
import client from '@/lib/db/client';
import { areaLabel } from '@/lib/staffAreas';

// Feature switches the super admin flips on /admin/super/features without a
// deploy (docs/SUPER-ADMIN-HUB.md stage F). One document in `app-settings`:
//   { _id: 'features', coversOpen, pushOpen, placesNewUntil, iconChangedAt,
//     changed: { [key]: { at, by: { id, name } } }, updatedAt }
// The constants.js values are the defaults: a missing document or field uses
// them, so deleting the document is the rollback. A failed read uses them too,
// so Covers fails closed.
//
// Reads are cached across requests for FEATURES_TTL_SECONDS and dropped on
// every change (`revalidateTag`). auth.js puts `coversOpen`, `pushOpen` and
// `placesNewUntil` on every session (`session.features`), so `canUseCovers`
// and `canUsePush` (lib/authz.js) stay synchronous checks; a change reaches
// each driver on their next request.

export const FEATURE_DEFAULTS = {
  coversOpen: COVERS_OPEN,
  pushOpen: PUSH_OPEN,
  placesNewUntil: PLACES_NEW_UNTIL,
  iconChangedAt: ICON_CHANGED_AT,
};

// What /admin/super/features and the audit trail call each switch.
export const FEATURE_LABELS = {
  coversOpen: 'Covers for every driver',
  pushOpen: 'Notifications for every driver',
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
    pushOpen: typeof doc?.pushOpen === 'boolean' ? doc.pushOpen : FEATURE_DEFAULTS.pushOpen,
    placesNewUntil: isIso(doc?.placesNewUntil) ? doc.placesNewUntil : FEATURE_DEFAULTS.placesNewUntil,
    iconChangedAt: isIso(doc?.iconChangedAt) ? doc.iconChangedAt : FEATURE_DEFAULTS.iconChangedAt,
    // Which switches differ from the code's defaults because of a saved value.
    saved: {
      coversOpen: typeof doc?.coversOpen === 'boolean',
      pushOpen: typeof doc?.pushOpen === 'boolean',
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

// What every session carries (auth.js): only what the menu and the Covers and
// push gates need, never who changed it.
export async function getSessionFeatures() {
  const { coversOpen, pushOpen, placesNewUntil } = await getFeatures();
  return { coversOpen, pushOpen, placesNewUntil };
}

// The features page reads past the cache, so it shows what's saved.
export async function getFeaturesFresh() {
  return readFeatures();
}

// `value` as the page sends it → { value } to save, or { error }.
//   coversOpen, pushOpen: true | false
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
    case 'pushOpen':
      return typeof value === 'boolean' ? { value } : { error: 'Notifications are on or off.' };
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

// Which admin tools ("areas", STAFF_AREAS in constants.js) each staff role may
// use, set with the switches on /admin/super/admins (docs/STAFF-ROLES.md).
// A second document in `app-settings`:
//   { _id: 'roles', admin: { [area]: bool }, dispatch: { [area]: bool },
//     changed: { [role]: { [area]: { at, by: { id, name } } } }, updatedAt }
// Only what the super admin switched is stored: a missing document, role or
// area means ROLE_AREA_DEFAULTS, so an area added to the code later starts at
// its default, and deleting the document is the rollback. Super admins have
// every area whatever is saved (areasFor, lib/staffAreas.js).
//
// Cached like the features: auth.js puts each account's areas on every
// session (`session.user.areas`), so a switch reaches staff on their next
// request.

const ROLES_TAG = 'app-roles';

// → { admin: [...keys], dispatch: [...keys] }, each in STAFF_AREAS order.
function roleAreasFrom(doc) {
  return Object.fromEntries(
    STAFF_ROLES.map((role) => [
      role,
      STAFF_AREA_KEYS.filter((key) => {
        const saved = doc?.[role]?.[key];
        return typeof saved === 'boolean' ? saved : ROLE_AREA_DEFAULTS[role].includes(key);
      }),
    ]),
  );
}

const roleAreaDefaults = () => roleAreasFrom(null);

async function readRoleAreas() {
  return roleAreasFrom(await settings().findOne({ _id: 'roles' }));
}

const cachedRoleAreas = unstable_cache(readRoleAreas, [ROLES_TAG], {
  tags: [ROLES_TAG],
  revalidate: FEATURES_TTL_SECONDS,
});

// For auth.js. Never throws: the defaults stand in for a failed read.
export async function getRoleAreas() {
  try {
    return await cachedRoleAreas();
  } catch (error) {
    console.error('Error reading role areas; using the defaults:', error);
    return roleAreaDefaults();
  }
}

// The Admins page reads past the cache, with who changed each switch.
// → { areas: { admin, dispatch }, changed }
export async function getRoleAreasFresh() {
  const doc = await settings().findOne({ _id: 'roles' });
  return { areas: roleAreasFrom(doc), changed: doc?.changed ?? {} };
}

// The body of PATCH /api/role-areas → { role, area, on }, or { error }.
export function validateRoleArea({ role, area, on } = {}) {
  if (!STAFF_ROLES.includes(role)) return { error: 'Unknown role.' };
  if (!STAFF_AREA_KEYS.includes(area)) return { error: 'Unknown tool.' };
  if (typeof on !== 'boolean') return { error: 'A tool is on or off.' };
  return { role, area, on };
}

// Turns one area on or off for a role, writing admin_audit first, then drops
// the cache. Takes what validateRoleArea returned. → getRoleAreasFresh().
export async function setRoleArea({ role, area, on }, actor) {
  const current = await getRoleAreasFresh();
  const was = current.areas[role].includes(area);
  if (was === on) return current;

  await recordAdminAction({
    actor,
    action: 'roleArea.changed',
    targetType: 'role',
    targetId: `${role}.${area}`,
    targetName: `${areaLabel(area)} for ${ROLE_LABELS[role]}`,
    from: was ? 'on' : 'off',
    to: on ? 'on' : 'off',
  });
  const at = new Date().toISOString();
  await settings().updateOne(
    { _id: 'roles' },
    {
      $set: {
        [`${role}.${area}`]: on,
        [`changed.${role}.${area}`]: { at, by: { id: actor?.id ?? null, name: actor?.name ?? null } },
        updatedAt: at,
      },
    },
    { upsert: true },
  );
  revalidateTag(ROLES_TAG);
  return getRoleAreasFresh();
}
