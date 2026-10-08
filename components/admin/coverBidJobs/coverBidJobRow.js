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
