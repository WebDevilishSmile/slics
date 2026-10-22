import client from '@/lib/db/client';

// `admin_audit`: one row per consequential admin action (SECURITY.md #17 step
// 3), so "who made this person an admin, and when" has an answer. Written
// *before* the change it records: if the write fails the change doesn't
// happen, a loud failure instead of a quiet gap.
//
//   { actorId, actorName, action, targetType, targetId, targetName, from, to, at }
//
// Actions so far: `role.granted` / `role.revoked` (admin, before 2026-10-16),
// `role.changed` (`from`/`to` 'user', 'dispatch' or 'admin', lib/db/admins.js),
// `roleArea.changed` (a staff role's tool switched; `targetId` is
// '<role>.<area>', `to` 'on' or 'off', docs/STAFF-ROLES.md), `membership.granted`
// / `membership.revoked` (bmcMember), `superAdmin.granted` / `.revoked`
// (scripts/setSuperAdmin.mjs, actor null), `support.linked` (an unmatched
// BMC email's support attached to the account; `to` is the email),
// `support.deleted` (a `bmc-events` row deleted, BMC's test deliveries;
// `from` is its type, amount and date, never the supporter's details),
// `report.deleted` (a `slic-reports` row deleted, test reports; `from` is its
// SLIC, kind and date, never the note or the reporter),
// `driver.verified` / `driver.unverified` (users.driver, `to` / `from` the
// sheet name), `coversAccess.granted` / `coversAccess.revoked` (Covers early
// access, users.coversAccess, lib/db/users.js), `driverClaim.rejected` (`to` the name claimed;
// lib/db/driverClaims.js), `password.resetLinkCreated` (a reset link was
// made for the target; never the link itself, docs/PASSWORD-RESET.md),
// `push.composed` (a notification the super admin wrote; `to` is its title,
// /api/push/compose), `feature.changed` (a feature switch; `targetId` is
// its key, `from`/`to` the values; lib/db/appSettings.js) and
// `push.failuresCleared` / `push.failuresClearUndone` (the push failures
// warning cleared, `to` the count, or the clear undone; lib/db/pushLog.js),
// and `coverBidDay.set` / `coverBidDay.reset` (a cover week's bid day moved,
// or back to the usual Thursday; `targetId` the week, `from`/`to` the dates;
// lib/db/coverBidDays.js).

const COLLECTION = 'admin_audit';

export async function recordAdminAction({ actor, action, targetType, targetId, targetName, from, to }) {
  await client
    .db()
    .collection(COLLECTION)
    .insertOne({
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      targetName: targetName ?? null,
      from: from ?? null,
      to: to ?? null,
      at: new Date(),
    });
}

export async function getAdminActions(actorId, { limit = 20 } = {}) {
  const collection = client.db().collection(COLLECTION);
  const [rows, count] = await Promise.all([
    collection.find({ actorId }).sort({ at: -1 }).limit(limit).toArray(),
    collection.countDocuments({ actorId }),
  ]);
  return { rows, count };
}
