import { ROLE_AREA_DEFAULTS, STAFF_AREA_KEYS, STAFF_AREAS, STAFF_ROLES } from '@/constants';

// The admin tools ("areas") an account may use (docs/STAFF-ROLES.md). Pure, so
// auth.js, lib/authz.js and client components share it.

// `user` is `{ role, superAdmin }` (a user row or a session's user);
// `roleAreas` is `{ admin: [...keys], dispatch: [...keys] }` as
// getRoleAreas (lib/db/appSettings.js) returns it. A super admin has every
// area, a staff role its role's, anyone else none.
export function areasFor(user, roleAreas) {
  if (user?.role === 'admin' && user.superAdmin === true) return [...STAFF_AREA_KEYS];
  if (!STAFF_ROLES.includes(user?.role)) return [];
  return roleAreas?.[user.role] ?? ROLE_AREA_DEFAULTS[user.role];
}

// Whether a session's `user` may use `area`: hasArea (lib/authz.js) for
// client components, which get the session's user. A super admin's `areas`
// is already every key; a session from before areas existed falls back to
// the role.
export const userHasArea = (user, area) =>
  (user?.areas ?? (user?.role === 'admin' ? STAFF_AREA_KEYS : [])).includes(area);

export const areaLabel = (key) => STAFF_AREAS.find((area) => area.key === key)?.label ?? key;

// The areas in `areas` (keys), in STAFF_AREAS order, as their full entries.
export const areaEntries = (areas) => STAFF_AREAS.filter((area) => areas.includes(area.key));
