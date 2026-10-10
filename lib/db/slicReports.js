import client from '@/lib/db/client';
import { ObjectId } from 'mongodb';
import { SLIC_REPORT_KINDS, SLIC_REPORT_NOTE_MAX_LENGTH } from '@/constants';

// "Something wrong?" reports on a SLIC (RECOMMENDATIONS.md #5), one document
// per report in `slic-reports`:
// `{ numSlic, userId: ObjectId | null, kind, note, status, created_at,
//    updated_at?, closed_at?, closedBy?: { id, name } }`.
// - `kind` is a SLIC_REPORT_KINDS value; `note` is plain text, maybe empty.
// - `status` is 'open', then 'resolved' (fixed through the edit form, so the
//   change is in slic_history) or 'dismissed' (nothing to change).
// - Timestamps are ISO strings. `userId` goes null when the driver deletes
//   their account; the report stays.
// Drivers only ever create reports. Everything that reads them is admin-only,
// and reporters' ids never leave the server.

const reports = () => client.db().collection('slic-reports');
const KINDS = new Map(SLIC_REPORT_KINDS.map((kind) => [kind.value, kind]));
const STATUSES = ['open', 'resolved', 'dismissed'];
const CLOSED_SHOWN = 20;

// A request body → `{ report: { numSlic, kind, note } }` or `{ error }` with a
// message for a 400.
export function validateSlicReport(body) {
  const numSlic = typeof body?.numSlic === 'string' ? body.numSlic.trim() : '';
  if (!/^[A-Za-z0-9]{1,12}$/.test(numSlic)) return { error: 'Which SLIC is this about?' };

  const kind = KINDS.get(body?.kind);
  if (!kind) return { error: "Pick what's wrong." };

  const note =
    typeof body?.note === 'string' ? body.note.replace(/\r\n?/g, '\n').trim() : '';
  if (note.length > SLIC_REPORT_NOTE_MAX_LENGTH) {
    return { error: `Keep the note to ${SLIC_REPORT_NOTE_MAX_LENGTH} characters.` };
  }
  if (kind.needsNote && !note) return { error: "Add a note saying what's wrong." };

  return { report: { numSlic, kind: kind.value, note } };
}

/**
 * Files a report. A driver who reports the same thing about the same SLIC
 * while their first report is still open updates that one instead of adding
 * another. Returns `{ notFound: true }` when the SLIC doesn't exist.
 */
export async function createSlicReport({ numSlic, kind, note, userId }) {
  const slic = await client
    .db()
    .collection('slics')
    .findOne({ numSlic }, { projection: { _id: 1 } });
  if (!slic) return { notFound: true };

  const now = new Date().toISOString();
  const owner = new ObjectId(userId);
  const existing = await reports().findOneAndUpdate(
    { numSlic, kind, userId: owner, status: 'open' },
    { $set: { note, updated_at: now } },
    { projection: { _id: 1 } },
  );
  if (existing) return { id: existing._id };

  const { insertedId } = await reports().insertOne({
    numSlic,
    userId: owner,
    kind,
    note,
    status: 'open',
    created_at: now,
  });
  return { id: insertedId };
}

// numSlic → how admins name it: a center's alpha code, a customer's name.
async function slicLabels(numSlics) {
  const unique = [...new Set(numSlics)];
  if (unique.length === 0) return new Map();
  const slics = await client
    .db()
    .collection('slics')
    .find(
      { numSlic: { $in: unique } },
      { projection: { numSlic: 1, type: 1, alphaSlic: 1, name: 1 } },
    )
    .toArray();
  return new Map(
    slics.map((slic) => [
      slic.numSlic,
      (slic.type === 'center' ? slic.alphaSlic : slic.name) || slic.alphaSlic || slic.numSlic,
    ]),
  );
}

async function reporterNames(userIds) {
  const ids = userIds.filter(Boolean);
  if (ids.length === 0) return new Map();
  const users = await client
    .db()
    .collection('users')
    .find({ _id: { $in: ids } }, { projection: { name: 1 } })
    .toArray();
  return new Map(users.map((user) => [user._id.toString(), user.name || 'A driver']));
}

async function shape(docs) {
  const [labels, names] = await Promise.all([
    slicLabels(docs.map((doc) => doc.numSlic)),
    reporterNames(docs.map((doc) => doc.userId)),
  ]);
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    numSlic: doc.numSlic,
    slicLabel: labels.get(doc.numSlic) ?? null,
    kind: doc.kind,
    note: doc.note || '',
    status: doc.status,
    reporter: doc.userId ? (names.get(doc.userId.toString()) ?? null) : null,
    created_at: doc.created_at,
    updated_at: doc.updated_at ?? null,
    closed_at: doc.closed_at ?? null,
    closedBy: doc.closedBy?.name ?? null,
  }));
}

// The admin queue (/admin/reports): every open report oldest first, so the
// longest-waiting is on top, then the latest closed ones.
export async function getSlicReports() {
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

// For the /admin banner and the menu badge: `{ count, slics }`, `slics` being
// the labels of the SLICs with open reports, most reported first.
export async function getOpenReportSummary() {
  const groups = await reports()
    .aggregate([
      { $match: { status: 'open' } },
      { $group: { _id: '$numSlic', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ])
    .toArray();
  const labels = await slicLabels(groups.map((group) => group._id));
  return {
    count: groups.reduce((total, group) => total + group.count, 0),
    slics: groups.map((group) => labels.get(group._id) ?? group._id),
  };
}

// One open report, shaped, for the notice on the edit form. null when it's
// gone, closed, or about another SLIC.
export async function getOpenSlicReport(reportId, numSlic) {
  if (!ObjectId.isValid(reportId)) return null;
  const doc = await reports().findOne({
    _id: new ObjectId(reportId),
    numSlic,
    status: 'open',
  });
  return doc ? (await shape([doc]))[0] : null;
}

/**
 * Closes a report as 'resolved' or 'dismissed', or reopens it ('open').
 * `actor` is the admin's session user. Returns `{ report }` (shaped) or
 * `{ error, status }`.
 */
export async function setSlicReportStatus(reportId, status, actor) {
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

// Account deletion: the reports stay (they're about the SLIC), unattributed.
export async function unlinkUserSlicReports(userId) {
  const { modifiedCount } = await reports().updateMany(
    { userId: new ObjectId(userId) },
    { $set: { userId: null } },
  );
  return { unlinkedSlicReports: modifiedCount };
}
