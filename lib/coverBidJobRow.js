import { DAY_FIELDS, DAY_LABELS, isDayTime } from '@/lib/dayFormat';

// Row model for the cover bid jobs editor.
//
// A "row" is an editable draft: the twelve job fields, plus `saved` holding the
// last persisted values (null for a row that has never been saved) so the editor
// can tell clean rows from dirty ones without refetching.

export const FIELDS = [
  'jobNumber',
  'name',
  'assignedDriver',
  'coverReason',
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'description',
];

// Just the persistable fields, dropping the editor's bookkeeping (key/_id/saved).
export function rowValues(row) {
  return Object.fromEntries(FIELDS.map((field) => [field, row[field]]));
}

export function toRowState(job) {
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, job[field] ?? ''])
  );
  // `sheetHidden` rides along outside FIELDS: it's the sheet's, never edited.
  return { key: job._id, _id: job._id, ...values, sheetHidden: Boolean(job.sheetHidden), saved: values };
}

export function emptyRowState() {
  const values = Object.fromEntries(FIELDS.map((field) => [field, '']));
  return {
    key: crypto.randomUUID(),
    _id: null,
    ...values,
    saved: null,
  };
}

export function isDirty(row) {
  if (!row.saved) return true;
  return FIELDS.some((field) => row[field] !== row.saved[field]);
}

// A row that has never been persisted can be dropped locally — nothing to delete
// server-side, and nothing to confirm.
export function isUnsaved(row) {
  return !row._id;
}

// A job number as the app compares it: the sheet's spacing and case don't
// matter. '' for a job with no number.
export function jobKey(jobNumber) {
  return jobNumber?.trim().toUpperCase() ?? '';
}

// Job numbers that appear on more than one row: a typo on the sheet, or a row
// the old photo upload read twice.
export function findDuplicateJobNumbers(rows) {
  const seen = new Set();
  const duplicates = new Set();
  for (const row of rows) {
    const key = jobKey(row.jobNumber);
    if (!key) continue;
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return duplicates;
}

export function isDuplicateJobNumber(row, duplicates) {
  return duplicates.has(jobKey(row.jobNumber));
}

// A job an admin hid from drivers (docs/COVER-JOB-HIDING.md). Hides outlive
// the job rows, which a sheet refresh replaces, so they name a job by its week
// and job number: hiding a number hides every row with it that week, and a
// job with no number can't be hidden.
export function hideKey(weekEnding, jobNumber) {
  return `${weekEnding}|${jobKey(jobNumber)}`;
}

// Jobs hidden from drivers without an admin's hide (docs/COVER-JOB-HIDING.md,
// "Automatic hides"): 'sheet' for a row the sheet's owner hid (the shifter
// jobs at the top of the tab), 'sleeper' for a sleeper team's job (ER18003),
// or null. An admin can't show these; the sheet decides.
const SLEEPER_JOB = /^ER\d/;

export function autoHideReason(job) {
  if (job?.sheetHidden) return 'sheet';
  if (SLEEPER_JOB.test(jobKey(job?.jobNumber))) return 'sleeper';
  return null;
}

// `hiddenKeys` is a Set of hideKeys (getHiddenJobKeys, lib/db/coverBidJobHides.js).
export function isJobHidden(job, hiddenKeys) {
  if (autoHideReason(job)) return true;
  return Boolean(jobKey(job.jobNumber)) && hiddenKeys.has(hideKey(job.weekEnding, job.jobNumber));
}

// A job someone has picked: the sheet writes their name in its NAME column
// (or a note like "cut"). Picked jobs show grayed out but still open. A
// driver's copy of the row (toDriverCoverJob) carries only `picked`.
export function isPicked(job) {
  if (typeof job?.picked === 'boolean') return job.picked;
  return Boolean(job?.name?.trim());
}

// What's worth a second look on a row before it's saved, as
// `{ field, message }` (`field` null for the row as a whole). None of it
// blocks a save: the sheet itself has rows with no job number.
export function rowIssues(row, { duplicate = false } = {}) {
  const issues = [];
  if (duplicate) {
    issues.push({ field: 'jobNumber', message: `${row.jobNumber} is on the list more than once` });
  }
  for (const day of DAY_FIELDS) {
    if (!isDayTime(row[day] ?? '')) {
      issues.push({ field: day, message: `${DAY_LABELS[day]} isn't a time ("${row[day]}")` });
    }
  }
  if (DAY_FIELDS.every((day) => !row[day])) {
    issues.push({ field: null, message: 'No day has a time' });
  }
  return issues;
}
