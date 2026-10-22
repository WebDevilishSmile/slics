import { DAY_LABELS } from '@/lib/dayFormat';
import { displayName } from '@/lib/names';

const PART_LABELS = { start: 'start', hours: 'hours', miles: 'miles' };

// 'mon.start' → 'Mon start', 'weekHours' → 'Week hours'.
export function fieldLabel(field) {
  if (!field) return '';
  const [day, part] = field.split('.');
  if (part) return `${DAY_LABELS[day] ?? day} ${PART_LABELS[part] ?? part}`;
  return { driver: 'Driver', description: 'Description', weekHours: 'Week hours', seniority: 'Seniority' }[field] ?? field;
}

// A value as the feed shows it: a driver's name capitalized (lib/names.js).
const shown = (field, value) => (field === 'driver' ? displayName(value) : value);

// One change as a line, without the job name: "Driver: Smith → Pope". An
// added or removed job's value is its driver.
export function describeJobChange(change) {
  if (change.kind === 'added') return `added to the sheet${change.to ? ` (${displayName(change.to)})` : ''}`;
  if (change.kind === 'removed') return `removed from the sheet${change.from ? ` (was ${displayName(change.from)})` : ''}`;
  return `${fieldLabel(change.field)}: ${shown(change.field, change.from) || '—'} → ${shown(change.field, change.to) || '—'}`;
}

// The filter chips over the Changes feed: label → `group` in sheet-job-changes.
export const CHANGE_GROUPS = [
  { value: null, label: 'All' },
  { value: 'driver', label: 'Driver' },
  { value: 'times', label: 'Times' },
  { value: 'description', label: 'Description' },
  { value: 'seniority', label: 'Seniority' },
];
