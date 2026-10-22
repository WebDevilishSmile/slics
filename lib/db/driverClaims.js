import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { recordAdminAction } from '@/lib/db/adminAudit';
import { DRIVER_CLAIM_NOTE_MAX_LENGTH, DRIVER_NAME_MAX_LENGTH } from '@/constants';
import { driverNameKey } from '@/lib/driverNames';
import { pickWeeksSince } from '@/lib/driverRoster';
import { formatWeekEnding, todayInNewYork } from '@/lib/onCallSheet';
import { displayName } from '@/lib/names';

// Driver verification (docs/COVER-BIDDING.md, stage 1). A driver asks to be
// verified with a claim; an admin checks it and links the account to the
// driver's name as the on-call sheet spells it.
//
// `driver-claims`, one document per claim:
//   { userId: ObjectId, name, employeeId, seniorityDate: 'YYYY-MM-DD',
//     status: 'pending' | 'approved' | 'rejected', note?, linkedName?,
//     created_at, updated_at?, decided_at?, decidedBy?: { id, name } }
// - A driver has at most one pending claim (a unique index); sending again
//   edits it.
// - `employeeId` (read from their UPS email) and `seniorityDate` are the
//   evidence. Both are deleted once an admin decides the claim, either way.
// - `note` is the admin's reason for turning it down: plain text, shown to the
//   driver. `linkedName` is the sheet name an approved claim was linked to.
// Timestamps are ISO strings. Claims are deleted with the account.
//
// The link itself is on the user row:
//   users.driver = { name, key, verifiedAt, verifiedBy: { id, name } }
// `name` is the sheet's spelling ("DOE, JANE"), `key` its driverNameKey,
// unique across users so one sheet name belongs to one account. An account is
// a verified driver while it has `driver.verifiedAt`.

const claims = () => client.db().collection('driver-claims');
const users = () => client.db().collection('users');

const DECIDED_SHOWN = 20;
// UPS employee IDs are digits; the length is a loose guard, not a format.
const EMPLOYEE_ID = /^\d{5,10}$/;

const now = () => new Date().toISOString();
const cleanName = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');
const stamp = (actor) => ({ id: actor?.id ?? null, name: actor?.name ?? null });
const iso = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const isRealDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

// A request body → `{ claim: { name, employeeId, seniorityDate } }` or
// `{ error }` with a message for a 400. The UPS email may come as the address
// (1234567@ups.com) or just the employee ID.
export function validateDriverClaim(body) {
  const name = cleanName(body?.name);
  if (name.length < 2) return { error: 'Enter your name as it is on the on-call sheet.' };
  if (name.length > DRIVER_NAME_MAX_LENGTH) {
    return { error: `Keep your name to ${DRIVER_NAME_MAX_LENGTH} characters.` };
  }

  const email =
    typeof body?.employeeEmail === 'string' ? body.employeeEmail.trim().toLowerCase() : '';
  const employeeId = /^(\d+)(?:@ups\.com)?$/.exec(email)?.[1];
  if (!employeeId || !EMPLOYEE_ID.test(employeeId)) {
    return { error: 'Enter your UPS email: your employee ID, then @ups.com.' };
  }

  const seniorityDate = typeof body?.seniorityDate === 'string' ? body.seniorityDate : '';
  if (!isRealDate(seniorityDate) || seniorityDate < '1960-01-01') {
    return { error: 'Enter your seniority date.' };
  }
  if (seniorityDate > todayInNewYork()) {
    return { error: "Your seniority date can't be in the future." };
  }

  return { claim: { name, employeeId, seniorityDate } };
}

// A claim as its own driver sees it on /covers. The evidence comes back only
// while the claim is pending, so the form can be edited; the reason only when
// it was turned down.
function ownClaim(doc) {
  if (!doc) return null;
  const pending = doc.status === 'pending';
  return {
    _id: doc._id.toString(),
    status: doc.status,
    name: doc.name,
    employeeEmail: pending && doc.employeeId ? `${doc.employeeId}@ups.com` : null,
    seniorityDate: pending ? (doc.seniorityDate ?? null) : null,
    note: doc.status === 'rejected' ? doc.note || '' : '',
    created_at: doc.created_at,
    updated_at: doc.updated_at ?? null,
    decided_at: doc.decided_at ?? null,
  };
}

// Files a claim, or edits the driver's pending one. → { claim } (ownClaim),
// and `created` when it's a new claim rather than an edit.
export async function createDriverClaim({ userId, name, employeeId, seniorityDate }) {
  const owner = new ObjectId(userId);
  const edit = () =>
    claims().findOneAndUpdate(
      { userId: owner, status: 'pending' },
      { $set: { name, employeeId, seniorityDate, updated_at: now() } },
      { returnDocument: 'after' },
    );

  let doc = await edit();
  let created = false;
  if (!doc) {
    const fresh = {
      userId: owner,
      name,
      employeeId,
      seniorityDate,
      status: 'pending',
      created_at: now(),
    };
    try {
      await claims().insertOne(fresh);
      doc = fresh;
      created = true;
    } catch (error) {
      // Two sends at once: the unique index let only one of them in.
      if (error?.code !== 11000) throw error;
      doc = await edit();
    }
  }
  return { claim: ownClaim(doc), created };
}

// The driver's latest claim (ownClaim), or null if they've never sent one.
export async function getMyDriverClaim(userId) {
  if (!userId || !ObjectId.isValid(userId)) return null;
  const doc = await claims()
    .find({ userId: new ObjectId(userId) })
    .sort({ created_at: -1 })
    .limit(1)
    .next();
  return ownClaim(doc);
}

async function claimAccounts(userIds) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (ids.length === 0) return new Map();
  const rows = await users()
    .find(
      { _id: { $in: ids.map((id) => new ObjectId(id)) } },
      { projection: { name: 1, email: 1, image: 1, created_at: 1, driver: 1 } },
    )
    .toArray();
  return new Map(
    rows.map((user) => [
      user._id.toString(),
      {
        _id: user._id.toString(),
        name: displayName(user.name ?? ''),
        email: user.email ?? '',
        image: user.image ?? null,
        joinedAt: iso(user.created_at),
        driverName: user.driver?.name ?? null,
      },
    ]),
  );
}

// The roster rows (`drivers`, admin-only) with the claimed employee IDs, as a
// hint beside each claim. Drivers come from the sheets now, not the roster, so
// a missing row means nothing. The roster stores some IDs as numbers.
async function rosterHints(employeeIds) {
  const ids = [...new Set(employeeIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const rows = await client
    .db()
    .collection('drivers')
    .find(
      { employeeId: { $in: [...ids, ...ids.map(Number)] } },
      { projection: { name: 1, employeeId: 1, seniorityDate: 1 } },
    )
    .toArray();
  return new Map(
    rows.map((row) => [
      String(Number(row.employeeId)),
      { _id: String(row._id), name: row.name ?? '', seniorityDate: String(row.seniorityDate ?? '') },
    ]),
  );
}

// Claims as the admin queue shows them: the account behind each (a brand-new
// account stands out by its join date) and the roster hint.
async function shapeForAdmin(docs) {
  const [accounts, hints] = await Promise.all([
    claimAccounts(docs.map((doc) => doc.userId)),
    rosterHints(docs.map((doc) => doc.employeeId)),
  ]);
  return docs.map((doc) => {
    const roster = doc.employeeId ? (hints.get(String(Number(doc.employeeId))) ?? null) : null;
    return {
      _id: doc._id.toString(),
      status: doc.status,
      name: doc.name,
      employeeEmail: doc.employeeId ? `${doc.employeeId}@ups.com` : null,
      seniorityDate: doc.seniorityDate ?? null,
      note: doc.note || '',
      linkedName: doc.linkedName ?? null,
      created_at: doc.created_at,
      updated_at: doc.updated_at ?? null,
      decided_at: doc.decided_at ?? null,
      decidedBy: doc.decidedBy?.name ?? null,
      account: doc.userId ? (accounts.get(doc.userId.toString()) ?? null) : null,
      roster: roster && {
        _id: roster._id,
        name: roster.name,
        seniorityDate: roster.seniorityDate.slice(0, 10),
        seniorityMatches: roster.seniorityDate.slice(0, 10) === doc.seniorityDate,
      },
    };
  });
}

// The admin queue (/admin/driver-claims): pending claims oldest first, so the
// longest-waiting is on top, then the latest decided ones.
export async function getDriverClaims() {
  const [pending, decided] = await Promise.all([
    claims().find({ status: 'pending' }).sort({ created_at: 1 }).toArray(),
    claims()
      .find({ status: { $ne: 'pending' } })
      .sort({ decided_at: -1 })
      .limit(DECIDED_SHOWN)
      .toArray(),
  ]);
  return { pending: await shapeForAdmin(pending), decided: await shapeForAdmin(decided) };
}

// For the /admin banner and the menu badge. A claim counts until it's decided.
export async function getPendingClaimCount() {
  return claims().countDocuments({ status: 'pending' });
}

// Everyone the sheets name, for the admin's pick: drivers on the Jobs tab and
// in the pick sections of the last few cover weeks, one entry per name key,
// `{ name, sources, linkedTo }`. `sources` says where the name was seen ("W/E
// 10/17 #7", "Job ER1234"); `linkedTo` is the account that already has it,
// `{ _id, name }`, or null. Admin-only: the list is every driver's name.
export async function getClaimableDriverNames() {
  const db = client.db();
  const since = pickWeeksSince();
  const [weeks, jobs, linked] = await Promise.all([
    db
      .collection('cover-bid-picks')
      .find({ weekEnding: { $gte: since } }, { projection: { weekEnding: 1, rows: 1 } })
      .sort({ weekEnding: -1 })
      .toArray(),
    db
      .collection('sheet-jobs')
      .find({ removedAt: { $exists: false } }, { projection: { jobName: 1, driver: 1 } })
      .sort({ sheetOrder: 1 })
      .toArray(),
    users()
      .find({ 'driver.key': { $type: 'string' } }, { projection: { name: 1, driver: 1 } })
      .toArray(),
  ]);

  const names = new Map();
  const add = (name, source) => {
    const key = driverNameKey(name);
    if (!key) return;
    if (!names.has(key)) names.set(key, { name: cleanName(name), sources: [] });
    const { sources } = names.get(key);
    if (sources.length < 3 && !sources.includes(source)) sources.push(source);
  };
  // Newest week first, so a name keeps the sheet's latest spelling.
  for (const week of weeks) {
    const label = `W/E ${formatWeekEnding(week.weekEnding).slice(0, -5)}`;
    for (const row of week.rows ?? []) {
      const order = String(row.order ?? '').trim();
      add(row.name ?? '', /^\d+$/.test(order) ? `${label} #${order}` : label);
    }
  }
  for (const job of jobs) add(job.driver ?? '', `Job ${job.jobName}`);

  const holders = new Map(
    linked.map((user) => [user.driver.key, { _id: user._id.toString(), name: displayName(user.name ?? '') }]),
  );
  return [...names.entries()]
    .map(([key, entry]) => ({ ...entry, linkedTo: holders.get(key) ?? null }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Approving (directly or through a claim) closes the account's pending claim.
async function closePendingClaim(userId, linkedName, actor) {
  await claims().updateMany(
    { userId, status: 'pending' },
    {
      $set: { status: 'approved', linkedName, decided_at: now(), decidedBy: stamp(actor) },
      $unset: { employeeId: '', seniorityDate: '' },
    },
  );
}

/**
 * Links an account to a driver as the sheet spells their name, which verifies
 * it, or changes the spelling it's linked by. `actor` is the admin's session
 * user; an admin can't verify their own account unless they're the super
 * admin. Written to `admin_audit` first. → { user } (no password) or
 * { error, status }.
 */
export async function setUserDriver(userId, name, actor) {
  if (!ObjectId.isValid(userId)) return { error: 'Invalid user id', status: 400 };
  const display = cleanName(name);
  const key = driverNameKey(display);
  if (!key || display.length > DRIVER_NAME_MAX_LENGTH) {
    return { error: "Pick the driver's name as the sheet spells it.", status: 400 };
  }
  if (String(userId) === String(actor?.id) && actor?.superAdmin !== true) {
    return { error: "You can't verify your own account. Ask another admin.", status: 403 };
  }

  const _id = new ObjectId(userId);
  const target = await users().findOne({ _id }, { projection: { password: 0 } });
  if (!target) return { error: 'User not found', status: 404 };
  const holder = await users().findOne(
    { 'driver.key': key, _id: { $ne: _id } },
    { projection: { name: 1 } },
  );
  if (holder) {
    return { error: `${display} is already linked to ${holder.name || 'another account'}.`, status: 409 };
  }

  let user = target;
  if (target.driver?.name !== display) {
    await recordAdminAction({
      actor,
      action: 'driver.verified',
      targetType: 'user',
      targetId: userId,
      targetName: target.name,
      from: target.driver?.name ?? null,
      to: display,
    });
    try {
      user = await users().findOneAndUpdate(
        { _id },
        { $set: { driver: { name: display, key, verifiedAt: now(), verifiedBy: stamp(actor) } } },
        { returnDocument: 'after', projection: { password: 0 } },
      );
    } catch (error) {
      // Another account took the name between the check and the write.
      if (error?.code === 11000) {
        return { error: `${display} is already linked to another account.`, status: 409 };
      }
      throw error;
    }
    if (!user) return { error: 'User not found', status: 404 };
  }

  await closePendingClaim(_id, display, actor);
  return { user };
}

// Takes an account's verification away. → { user } or { error, status }.
export async function clearUserDriver(userId, actor) {
  if (!ObjectId.isValid(userId)) return { error: 'Invalid user id', status: 400 };
  const _id = new ObjectId(userId);
  const target = await users().findOne({ _id }, { projection: { password: 0 } });
  if (!target) return { error: 'User not found', status: 404 };
  if (!target.driver) return { user: target };

  await recordAdminAction({
    actor,
    action: 'driver.unverified',
    targetType: 'user',
    targetId: userId,
    targetName: target.name,
    from: target.driver.name ?? null,
    to: null,
  });
  const user = await users().findOneAndUpdate(
    { _id },
    { $unset: { driver: '' } },
    { returnDocument: 'after', projection: { password: 0 } },
  );
  if (!user) return { error: 'User not found', status: 404 };
  return { user };
}

/**
 * An admin's decision on a pending claim. `{ status: 'approved', name }` links
 * the account to `name` (setUserDriver); `{ status: 'rejected', note }` turns
 * it down with a reason the driver sees. Either way the evidence is deleted.
 * Nobody decides their own claim but the super admin. → { claim } (shaped for
 * the queue) or { error, status }.
 */
export async function decideDriverClaim(claimId, body, actor) {
  if (!ObjectId.isValid(claimId)) return { error: 'Invalid claim.', status: 400 };
  const status = body?.status;
  if (status !== 'approved' && status !== 'rejected') {
    return { error: 'Invalid decision.', status: 400 };
  }

  const _id = new ObjectId(claimId);
  const claim = await claims().findOne({ _id });
  if (!claim) return { error: 'That claim no longer exists.', status: 404 };
  if (claim.status !== 'pending') return { error: 'That claim was already decided.', status: 409 };
  if (String(claim.userId) === String(actor?.id) && actor?.superAdmin !== true) {
    return { error: "You can't decide your own claim. Ask another admin.", status: 403 };
  }

  if (status === 'approved') {
    const result = await setUserDriver(claim.userId.toString(), body.name, actor);
    if (result.error) return result;
  } else {
    const note = typeof body.note === 'string' ? body.note.replace(/\r\n?/g, '\n').trim() : '';
    if (note.length > DRIVER_CLAIM_NOTE_MAX_LENGTH) {
      return { error: `Keep the reason to ${DRIVER_CLAIM_NOTE_MAX_LENGTH} characters.`, status: 400 };
    }
    const account = await users().findOne({ _id: claim.userId }, { projection: { name: 1 } });
    await recordAdminAction({
      actor,
      action: 'driverClaim.rejected',
      targetType: 'user',
      targetId: claim.userId,
      targetName: account?.name ?? null,
      from: null,
      to: claim.name,
    });
    await claims().updateOne(
      { _id, status: 'pending' },
      {
        $set: { status: 'rejected', note, decided_at: now(), decidedBy: stamp(actor) },
        $unset: { employeeId: '', seniorityDate: '' },
      },
    );
  }

  const doc = await claims().findOne({ _id });
  return { claim: (await shapeForAdmin([doc]))[0] };
}

// Account deletion: the claims go too, evidence and all.
export async function deleteUserDriverClaims(userId) {
  const { deletedCount } = await claims().deleteMany({ userId: new ObjectId(userId) });
  return { deletedDriverClaims: deletedCount };
}
