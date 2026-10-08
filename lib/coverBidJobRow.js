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
  return { key: job._id, _id: job._id, ...values, saved: values };
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

// Job numbers that appear on more than one row. Two photos that overlap can
// put the same printed row on the list twice.
export function findDuplicateJobNumbers(rows) {
  const seen = new Set();
  const duplicates = new Set();
  for (const row of rows) {
    const jobNumber = row.jobNumber?.trim().toUpperCase();
    if (!jobNumber) continue;
    if (seen.has(jobNumber)) duplicates.add(jobNumber);
    seen.add(jobNumber);
  }
  return duplicates;
}

export function isDuplicateJobNumber(row, duplicates) {
  return duplicates.has(row.jobNumber?.trim().toUpperCase());
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
