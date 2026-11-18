import { DAY_LABELS } from '@/lib/dayFormat';
import { displayName } from '@/lib/names';

// 'assignedDriver' → 'Assigned driver', 'mon' → 'Mon'.
export function coverFieldLabel(field) {
  return (
    DAY_LABELS[field] ??
    { name: 'Name', assignedDriver: 'Assigned driver', coverReason: 'Cover reason', description: 'Description' }[field] ??
    field
  );
}

// The job a change is about, as the cover tab numbers it: "SH16". A posted
// week has none.
export const changeJob = (change) => (change.kind === 'posted' ? null : change.jobNumber || 'No job #');

// A value as the feed shows it: a driver's name capitalized (lib/names.js),
// anything else (a time, a cover reason like FMLA) as the sheet writes it.
const NAME_FIELDS = new Set(['name', 'assignedDriver']);
const shown = (field, value) => (NAME_FIELDS.has(field) ? displayName(value) : value);

// An added or removed job's "name · cover reason". A lone part is a name only
// when it's written LAST, FIRST, so a reason on its own stays as it is.
function summary(text) {
  const [first, ...rest] = String(text).split(' · ');
  return [rest.length > 0 || first.includes(',') ? displayName(first) : first, ...rest].join(' · ');
}

// A field whose value is too long for a one-line summary: a description is a
// whole route ("Mon-Thu: BETPA>REAPA>ALLPA>… / Fri: …").
const LONG_FIELDS = new Set(['description']);

// "Description changed", "Description added" (it was empty), "Description
// removed": for a summary that names the field without its route.
export function briefFieldChange(label, from, to) {
  if (!from) return `${label} added`;
  if (!to) return `${label} removed`;
  return `${label} changed`;
}

// One change as a line, without the week or the job: "Mon: 22:00 → 21:00".
// Admin-only (lib/db/coverJobChanges.js): it says names and cover reasons.
// `brief` (the /admin banner) says only that a long field changed, so a
// route's description doesn't fill the card; the feed shows the full line.
export function describeCoverJobChange(change, { brief = false } = {}) {
  if (change.kind === 'posted') return `Week posted with ${change.jobs ?? 0} job${change.jobs === 1 ? '' : 's'}`;
  if (change.kind === 'added') return `added${change.to ? ` (${summary(change.to)})` : ''}`;
  if (change.kind === 'removed') return `removed${change.from ? ` (was ${summary(change.from)})` : ''}`;
  if (brief && LONG_FIELDS.has(change.field)) return briefFieldChange(coverFieldLabel(change.field), change.from, change.to);
  return `${coverFieldLabel(change.field)}: ${shown(change.field, change.from) || '—'} → ${shown(change.field, change.to) || '—'}`;
}
