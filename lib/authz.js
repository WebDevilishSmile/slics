import { NextResponse } from 'next/server';
import { cache } from 'react';
import { auth } from '@/auth';
import { COVERS_OPEN, PUSH_OPEN, STAFF_AREA_KEYS } from '@/constants';
import { areaLabel, userHasArea } from '@/lib/staffAreas';

// The one place that reads the session (docs/SECURITY.md #4). Routes, pages and
// server components call these instead of `auth()`, so the boundary is written
// once instead of from memory in every new file.

// A session only counts if it names a user. On a misconfigured deployment
// (no AUTH_SECRET, say) older Auth.js betas returned an error object from
// `auth()` instead of null, which made every `if (!session)` pass
// (GHSA-8fpg-xm3f-6cx3). Beta.32 fixed that; this keeps the guard from
// depending on it.
//
// Cached per request: each `auth()` runs auth.js's jwt callback, which reads
// the user row, and a page render asks several times (the root layout, the
// header, the page). Treat the result as read-only; every caller shares it.
export const getSession = cache(async () => {
  const session = await auth();
  return session?.user?.id ? session : null;
});

// Admin pages check their area with getAreaSession (below), which replaced
// getAdminSession on 2026-10-16 (docs/STAFF-ROLES.md). The layout's redirect
// message is only the friendly part: a layout doesn't re-run on client
// navigation, and a page segment can be requested on its own
// (docs/SECURITY.md #7).

// For route handlers: `{ session }` when allowed, `{ denied }` (the response
// to return) when not.
//
//   const { session, denied } = await requireAdmin();
//   if (denied) return denied;
export async function requireUser() {
  const session = await getSession();
  if (!session) {
    return {
      denied: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { session };
}

// `session.user.role` is fresh: auth.js's jwt callback re-reads the user row on
// every request, so there's no need to look the user up again.
export async function requireAdmin() {
  const result = await requireUser();
  if (result.denied) return result;
  if (result.session.user.role !== 'admin') {
    return {
      denied: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 },
      ),
    };
  }
  return result;
}

// A super admin is an admin with `superAdmin: true` on their user row: every
// admin check still passes for them, and only they manage admins and see
// Buy Me a Coffee support. Set by scripts/setSuperAdmin.mjs, never from the app.
export const isSuperAdmin = (session) =>
  session?.user?.role === 'admin' && session.user.superAdmin === true;

export async function requireSuperAdmin() {
  const result = await requireAdmin();
  if (result.denied) return result;
  if (!isSuperAdmin(result.session)) {
    return {
      denied: NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 },
      ),
    };
  }
  return result;
}

// Admin tools are "areas" (STAFF_AREAS in constants.js, docs/STAFF-ROLES.md):
// SLICs, Jobs, Covers and so on. The super admin chooses which areas each
// staff role (admin, dispatch) has on /admin/super/admins, and auth.js puts
// the account's on every session as `session.user.areas`, fresh like `role`.
// A super admin has every one. Every admin page checks its area with
// `getAreaSession`, every admin route with `requireArea`; never a role literal.
// A session from before areas existed falls back to the role (userHasArea,
// lib/staffAreas.js, which client components use on the session's user).
export const hasArea = (session, area) =>
  Boolean(session?.user?.id) && (isSuperAdmin(session) || userHasArea(session.user, area));

// The areas (keys) a session may use, in STAFF_AREAS order.
export const areasOf = (session) => STAFF_AREA_KEYS.filter((key) => hasArea(session, key));

// Staff: an account with at least one area. Lets them into the /admin layout
// and the header menu's alerts.
export const isStaff = (session) => areasOf(session).length > 0;

// For admin pages: the session when the caller may use `area`, otherwise null
// (render components/admin/NoAccess.jsx).
//
//   const session = await getAreaSession('slics');
//   if (!session) return <NoAccess />;
export async function getAreaSession(area) {
  const session = await getSession();
  return hasArea(session, area) ? session : null;
}

// For route handlers, like requireAdmin.
//
//   const { session, denied } = await requireArea('slics');
//   if (denied) return denied;
export async function requireArea(area) {
  const result = await requireUser();
  if (result.denied) return result;
  if (!hasArea(result.session, area)) {
    return {
      denied: NextResponse.json(
        { error: `You don't have access to ${areaLabel(area)}.` },
        { status: 403 },
      ),
    };
  }
  return result;
}

// For a route any staff member may call, which answers only for their areas
// (GET /api/admin-alerts).
export async function requireStaff() {
  const result = await requireUser();
  if (result.denied) return result;
  if (!isStaff(result.session)) {
    return {
      denied: NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 }),
    };
  }
  return result;
}

// Covers and driver verification (docs/COVER-BIDDING.md) are admin-only while
// they're tested: admins try them as drivers will (super admins only for a few
// hours on 2026-10-12). The super admin's "Covers for every driver" switch (/admin/super/features,
// lib/db/appSettings.js) opens them to every signed-in driver. auth.js puts it
// on every session as `session.features.coversOpen`; COVERS_OPEN in
// constants.js is the default. Pages check `canUseCovers` before reading
// anything; routes call `requireCovers()`. The admin tools (/admin/cover/*,
// /admin/driver-claims) stay with every admin.
export const coversOpen = (session) => session?.features?.coversOpen ?? COVERS_OPEN;

// Staff with the Covers area are the testers (docs/STAFF-ROLES.md), and the
// super admin can let anyone else in early, one account at a time, on
// /admin/users (`session.user.coversAccess`, fresh like `role`;
// setCoversAccess, lib/db/users.js). Early access only adds: it never keeps
// anyone out once Covers is open.
export const canUseCovers = (session) =>
  Boolean(session?.user?.id) &&
  (coversOpen(session) || hasArea(session, 'covers') || session.user.coversAccess === true);

export async function requireCovers() {
  const result = await requireUser();
  if (result.denied) return result;
  if (!canUseCovers(result.session)) {
    return {
      denied: NextResponse.json(
        { error: "Covers isn't open to every driver yet." },
        { status: 403 },
      ),
    };
  }
  return result;
}

// Push notifications (docs/PUSH-NOTIFICATIONS.md) are admin-only until stage 2
// rolls out: the super admin's "Notifications for every driver" switch
// (/admin/super/features) opens them to every signed-in driver, on every
// session as `session.features.pushOpen`; PUSH_OPEN in constants.js is the
// default. The /profile switch checks `canUsePush`; the
// /api/users/me/push-* routes call `requirePush()`. Closing it also stops
// sends to drivers (getDriverPushAudience, lib/db/users.js).
export const pushOpen = (session) => session?.features?.pushOpen ?? PUSH_OPEN;

export const canUsePush = (session) =>
  Boolean(session?.user?.id) && (pushOpen(session) || session.user.role === 'admin');

export async function requirePush() {
  const result = await requireUser();
  if (result.denied) return result;
  if (!canUsePush(result.session)) {
    return {
      denied: NextResponse.json({ error: 'Notifications are admin-only for now.' }, { status: 403 }),
    };
  }
  return result;
}

// A driver an admin has verified (lib/db/driverClaims.js), who sees the cover
// list. `driverVerified` is fresh like `role`.
export const isVerifiedDriver = (session) =>
  canUseCovers(session) && session.user.driverVerified === true;

// For routes only a verified driver may use, such as their cover list
// (docs/COVER-BIDDING.md, stage 2). Admins too need a verification: a list
// belongs to a driver on the sheet.
export async function requireVerifiedDriver() {
  const result = await requireCovers();
  if (result.denied) return result;
  if (!isVerifiedDriver(result.session)) {
    return {
      denied: NextResponse.json(
        { error: 'Only verified drivers can keep a cover list.' },
        { status: 403 },
      ),
    };
  }
  return result;
}
