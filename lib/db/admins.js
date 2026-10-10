import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { getAdminActions, recordAdminAction } from '@/lib/db/adminAudit';

// The super admin's Admins page: who the admins are, what they've done, and
// granting or revoking the role. A super admin's own row is never changed from
// the app (scripts/setSuperAdmin.mjs is the only way), and nobody changes their
// own role, so the last super admin can't lock themselves out.

const iso = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

// Grants (`makeAdmin: true`) or revokes the admin role. → { user } with the
// updated row (no password), or { error, status }.
export async function setAdminRole(targetId, makeAdmin, actor) {
  if (!ObjectId.isValid(targetId)) return { error: 'Invalid user id', status: 400 };
  if (String(targetId) === String(actor?.id)) {
    return { error: "You can't change your own role", status: 403 };
  }

  const users = client.db().collection('users');
  const _id = new ObjectId(targetId);
  const target = await users.findOne({ _id }, { projection: { password: 0 } });
  if (!target) return { error: 'User not found', status: 404 };
  if (target.superAdmin === true) {
    return { error: "A super admin's role can't be changed here", status: 403 };
  }

  const from = target.role || 'user';
  const to = makeAdmin ? 'admin' : 'user';
  if (from === to) return { user: target };

  await recordAdminAction({
    actor,
    action: makeAdmin ? 'role.granted' : 'role.revoked',
    targetType: 'user',
    targetId,
    targetName: target.name,
    from,
    to,
  });
  const user = await users.findOneAndUpdate(
    { _id },
    { $set: { role: to } },
    { returnDocument: 'after', projection: { password: 0 } },
  );
  if (!user) return { error: 'User not found', status: 404 };
  return { user };
}

// Everything an admin has done that the app records, newest first. Only some
// of it has an author: SLIC history, cover jobs, gyms, cover-week refreshes and
// (since the Admins page) `admin_audit`. Comment deletions and driver-roster
// edits still record nobody (SECURITY.md #17).
async function adminActivity(db, id) {
  const [history, historyCount, weeks, jobEdits, gyms, picks, audit] = await Promise.all([
    db
      .collection('slic_history')
      .find({ 'user.id': id }, { projection: { action: 1, numSlic: 1, changes: 1, timestamp: 1 } })
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray(),
    db.collection('slic_history').countDocuments({ 'user.id': id }),
    // Cover jobs come in a week at a time, so one line per week.
    db
      .collection('cover-bid-jobs')
      .aggregate([
        { $match: { 'createdBy.id': id } },
        { $group: { _id: '$weekEnding', count: { $sum: 1 }, at: { $max: '$created_at' } } },
        { $sort: { at: -1 } },
      ])
      .toArray(),
    db
      .collection('cover-bid-jobs')
      .find({ 'updatedBy.id': id }, { projection: { jobNumber: 1, weekEnding: 1, updated_at: 1 } })
      .sort({ updated_at: -1 })
      .limit(20)
      .toArray(),
    db
      .collection('gyms')
      .find(
        { $or: [{ 'createdBy.id': id }, { 'updatedBy.id': id }] },
        { projection: { name: 1, createdBy: 1, created_at: 1, updatedBy: 1, updated_at: 1 } },
      )
      .toArray(),
    db
      .collection('cover-bid-picks')
      .find({ 'refreshedBy.id': id }, { projection: { weekEnding: 1, refreshed_at: 1 } })
      .toArray(),
    getAdminActions(id),
  ]);

  const items = [
    ...history.map((row) => ({
      at: iso(row.timestamp),
      text:
        row.action === 'created'
          ? `Added SLIC ${row.numSlic}`
          : `Edited SLIC ${row.numSlic}${row.changes?.length ? ` (${row.changes.map((c) => c.field).join(', ')})` : ''}`,
    })),
    ...weeks.map((week) => ({
      at: iso(week.at),
      text: `Saved ${week.count} cover job${week.count === 1 ? '' : 's'} for the week ending ${week._id}`,
    })),
    ...jobEdits.map((job) => ({
      at: iso(job.updated_at),
      text: `Edited cover job${job.jobNumber ? ` ${job.jobNumber}` : ''} (week ending ${job.weekEnding})`,
    })),
    ...gyms.flatMap((gym) => [
      ...(gym.createdBy?.id === id ? [{ at: iso(gym.created_at), text: `Added gym ${gym.name}` }] : []),
      ...(gym.updatedBy?.id === id ? [{ at: iso(gym.updated_at), text: `Edited gym ${gym.name}` }] : []),
    ]),
    ...picks.map((week) => ({
      at: iso(week.refreshed_at),
      text: `Last refreshed the cover week ending ${week.weekEnding}`,
    })),
    ...audit.rows.map((row) => ({ at: iso(row.at), text: auditText(row) })),
  ]
    .filter((item) => item.at)
    .sort((a, b) => b.at.localeCompare(a.at));

  const gymCount = gyms.reduce(
    (sum, gym) => sum + (gym.createdBy?.id === id) + (gym.updatedBy?.id === id),
    0,
  );

  return {
    counts: {
      slicEdits: historyCount,
      coverJobs: weeks.reduce((sum, week) => sum + week.count, 0) + jobEdits.length,
      gyms: gymCount,
      coverRefreshes: picks.length,
      adminActions: audit.count,
    },
    lastActiveAt: items[0]?.at ?? null,
    recent: items.slice(0, 15),
  };
}

function auditText(row) {
  const who = row.targetName || 'a user';
  switch (row.action) {
    case 'role.granted':
      return `Made ${who} an admin`;
    case 'role.revoked':
      return `Removed ${who} as an admin`;
    case 'membership.granted':
      return `Turned membership on for ${who}`;
    case 'membership.revoked':
      return `Turned membership off for ${who}`;
    default:
      return `${row.action} (${who})`;
  }
}

// → { admins, candidates }: every admin with their activity, and everyone else
// (name and email) for the "add an admin" picker. Super-admin-only data.
export async function getAdminOverview() {
  const db = client.db();
  const users = db.collection('users');

  const [admins, candidates] = await Promise.all([
    users
      .find({ role: 'admin' }, { projection: { name: 1, email: 1, image: 1, superAdmin: 1, created_at: 1 } })
      .sort({ name: 1 })
      .toArray(),
    users
      .find({ role: { $ne: 'admin' } }, { projection: { name: 1, email: 1 } })
      .sort({ name: 1 })
      .toArray(),
  ]);

  const rows = await Promise.all(
    admins.map(async (admin) => {
      const id = String(admin._id);
      const [activity, lookups, lastLookup] = await Promise.all([
        adminActivity(db, id),
        db.collection('slicViews').countDocuments({ userId: admin._id }),
        db
          .collection('slicViews')
          .find({ userId: admin._id }, { projection: { viewedAt: 1 } })
          .sort({ viewedAt: -1 })
          .limit(1)
          .next(),
      ]);
      return {
        _id: id,
        name: admin.name ?? '',
        email: admin.email ?? '',
        image: admin.image ?? null,
        superAdmin: admin.superAdmin === true,
        joinedAt: iso(admin.created_at),
        lookups,
        lastLookupAt: iso(lastLookup?.viewedAt),
        ...activity,
      };
    }),
  );

  // Super admins first, then by name.
  rows.sort((a, b) => b.superAdmin - a.superAdmin || a.name.localeCompare(b.name));

  return {
    admins: rows,
    candidates: candidates.map((user) => ({
      _id: String(user._id),
      name: user.name ?? '',
      email: user.email ?? '',
    })),
  };
}
