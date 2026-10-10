import client from '@/lib/db/client';

// `admin_audit`: one row per consequential admin action (SECURITY.md #17 step
// 3), so "who made this person an admin, and when" has an answer. Written
// *before* the change it records: if the write fails the change doesn't
// happen, a loud failure instead of a quiet gap.
//
//   { actorId, actorName, action, targetType, targetId, targetName, from, to, at }
//
// Actions so far: `role.granted` / `role.revoked` (admin), `membership.granted`
// / `membership.revoked` (bmcMember), `superAdmin.granted` / `.revoked`
// (scripts/setSuperAdmin.mjs, actor null).

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
