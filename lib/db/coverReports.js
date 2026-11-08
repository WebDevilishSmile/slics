import client from '@/lib/db/client';
import { ObjectId } from 'mongodb';
import { COVER_REPORT_KINDS, COVER_REPORT_NOTE_MAX_LENGTH } from '@/constants';
import { displayName } from '@/lib/names';
import { isSaturday } from '@/lib/onCallSheet';

// "Report a problem" on /covers (docs/COVER-BIDDING.md "Reference only and
// cover reports"): a driver tells the admins something on a week's covers
// doesn't match the on-call sheet or dispatch. One document per report in
// `cover-reports`:
// `{ userId: ObjectId | null, driverName (the sheet name the account was
//    linked to, or null), weekEnding, kind, jobNumber, note, status,
//    created_at, updated_at?, closed_at?, closedBy?: { id, name } }`.
// - `kind` is a COVER_REPORT_KINDS value; `jobNumber` and `note` are plain
//   text, maybe empty.
// - `status` is 'open', then 'resolved' (fixed in the sheet, or it was right)
//   or 'dismissed' (nothing to change).
// - Timestamps are ISO strings. `userId` goes null when the driver deletes
//   their account; the report stays, unattributed.
// Drivers only ever create reports. Everything that reads them is admin-only
// (the Covers area), and reporters' ids never leave the server.

const reports = () => client.db().collection('cover-reports');
const KINDS = new Map(COVER_REPORT_KINDS.map((kind) => [kind.value, kind]));
const STATUSES = ['open', 'resolved', 'dismissed'];
const CLOSED_SHOWN = 20;

// A request body → `{ report: { weekEnding, kind, jobNumber, note } }` or
// `{ error }` with a message for a 400.
export function validateCoverReport(body) {
  const weekEnding = typeof body?.weekEnding === 'string' ? body.weekEnding.trim() : '';
  if (!isSaturday(weekEnding)) return { error: 'Which week is this about?' };

  const kind = KINDS.get(body?.kind);
  if (!kind) return { error: "Pick what's wrong." };

  const jobNumber =
    typeof body?.jobNumber === 'string' ? body.jobNumber.trim().toUpperCase() : '';
  if (jobNumber && !/^[A-Z0-9]{1,12}$/.test(jobNumber)) {
    return { error: 'A job number is letters and digits, like SH14.' };
  }

  const note = typeof body?.note === 'string' ? body.note.replace(/\r\n?/g, '\n').trim() : '';
  if (note.length > COVER_REPORT_NOTE_MAX_LENGTH) {
    return { error: `Keep the note to ${COVER_REPORT_NOTE_MAX_LENGTH} characters.` };
  }
  if (kind.needsNote && !note) return { error: "Add a note saying what's wrong." };

  return { report: { weekEnding, kind: kind.value, jobNumber, note } };
}

/**
 * Files a report. A driver who reports the same thing about the same week and
 * job while their first report is still open updates that one instead of
 * adding another. Returns `{ id }`, with `updated: true` for that case.
 */
export async function createCoverReport({ weekEnding, kind, jobNumber, note, userId, driverName = null }) {
  const now = new Date().toISOString();
  const owner = new ObjectId(userId);
  const existing = await reports().findOneAndUpdate(
    { userId: owner, weekEnding, kind, jobNumber, status: 'open' },
    { $set: { note, updated_at: now } },
    { projection: { _id: 1 } },
  );
  if (existing) return { id: existing._id, updated: true };

  const { insertedId } = await reports().insertOne({
    userId: owner,
    driverName,
    weekEnding,
    kind,
    jobNumber,
    note,
    status: 'open',
    created_at: now,
  });
  return { id: insertedId };
}

async function reporterNames(userIds) {
  const ids = userIds.filter(Boolean);
  if (ids.length === 0) return new Map();
  const users = await client
    .db()
    .collection('users')
    .find({ _id: { $in: ids } }, { projection: { name: 1 } })
    .toArray();
  return new Map(users.map((user) => [user._id.toString(), displayName(user.name) || 'A driver']));
}

async function shape(docs) {
  const names = await reporterNames(docs.map((doc) => doc.userId));
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    weekEnding: doc.weekEnding,
    kind: doc.kind,
    jobNumber: doc.jobNumber || '',
    note: doc.note || '',
    status: doc.status,
    reporter: doc.userId ? (names.get(doc.userId.toString()) ?? null) : null,
    driverName: doc.userId ? displayName(doc.driverName ?? null) : null,
    created_at: doc.created_at,
    updated_at: doc.updated_at ?? null,
    closed_at: doc.closed_at ?? null,
    closedBy: doc.closedBy?.name ?? null,
  }));
}

// The admin queue (/admin/cover/reports): every open report oldest first, so
// the longest-waiting is on top, then the latest closed ones.
export async function getCoverReports() {
  const [open, closed] = await Promise.all([
    reports().find({ status: 'open' }).sort({ created_at: 1 }).toArray(),
    reports()
      .find({ status: { $ne: 'open' } })
      .sort({ closed_at: -1 })
      .limit(CLOSED_SHOWN)
      .toArray(),
  ]);
  return { open: await shape(open), closed: await shape(closed) };
}

// For the banners, the hub tile and the menu badge: `{ count, weeks }`,
// `weeks` the weeks with open reports, most reported first.
export async function getOpenCoverReportSummary() {
  const groups = await reports()
    .aggregate([
      { $match: { status: 'open' } },
      { $group: { _id: '$weekEnding', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ])
    .toArray();
  return {
    count: groups.reduce((total, group) => total + group.count, 0),
    weeks: groups.map((group) => group._id),
  };
}

/**
 * Closes a report as 'resolved' or 'dismissed', or reopens it ('open').
 * `actor` is the admin's session user. Returns `{ report }` (shaped) or
 * `{ error, status }`.
 */
export async function setCoverReportStatus(reportId, status, actor) {
  if (!ObjectId.isValid(reportId)) return { error: 'Invalid report.', status: 400 };
  if (!STATUSES.includes(status)) return { error: 'Invalid status.', status: 400 };

  const update =
    status === 'open'
      ? { $set: { status }, $unset: { closed_at: '', closedBy: '' } }
      : {
          $set: {
            status,
            closed_at: new Date().toISOString(),
            closedBy: { id: actor.id, name: actor.name ?? null },
          },
        };
  const doc = await reports().findOneAndUpdate({ _id: new ObjectId(reportId) }, update, {
    returnDocument: 'after',
  });
  if (!doc) return { error: 'That report no longer exists.', status: 404 };
  return { report: (await shape([doc]))[0] };
}

// What `admin_audit` keeps of a report before it's deleted: its week, kind,
// job and date, never the note or who filed it. null when it's gone.
export async function getCoverReportSummary(reportId) {
  if (!ObjectId.isValid(reportId)) return null;
  const doc = await reports().findOne(
    { _id: new ObjectId(reportId) },
    { projection: { weekEnding: 1, kind: 1, jobNumber: 1, created_at: 1 } },
  );
  if (!doc) return null;
  const kind = KINDS.get(doc.kind)?.label ?? 'Something else';
  return {
    _id: doc._id,
    text: `W/E ${doc.weekEnding}${doc.jobNumber ? ` · ${doc.jobNumber}` : ''} · ${kind} · ${doc.created_at?.slice(0, 10) ?? 'no date'}`,
  };
}

// Deletes a report for good: test reports, or ones filed by mistake. An admin
// closes a real one with Fixed or Dismiss instead. Returns whether it was there.
export async function deleteCoverReport(reportId) {
  if (!ObjectId.isValid(reportId)) return false;
  const { deletedCount } = await reports().deleteOne({ _id: new ObjectId(reportId) });
  return deletedCount === 1;
}

// Account deletion: the reports stay (they're about the sheet), unattributed,
// and the linked name goes with the account.
export async function unlinkUserCoverReports(userId) {
  const { modifiedCount } = await reports().updateMany(
    { userId: new ObjectId(userId) },
    { $set: { userId: null, driverName: null } },
  );
  return { unlinkedCoverReports: modifiedCount };
}
