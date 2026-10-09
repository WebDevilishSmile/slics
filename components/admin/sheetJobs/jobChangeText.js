import { DAY_LABELS } from '@/lib/dayFormat';

const PART_LABELS = { start: 'start', hours: 'hours', miles: 'miles' };

// 'mon.start' → 'Mon start', 'weekHours' → 'Week hours'.
export function fieldLabel(field) {
  if (!field) return '';
  const [day, part] = field.split('.');
  if (part) return `${DAY_LABELS[day] ?? day} ${PART_LABELS[part] ?? part}`;
  return { driver: 'Driver', description: 'Description', weekHours: 'Week hours', seniority: 'Seniority' }[field] ?? field;
}

// One change as a line, without the job name: "Driver: Smith → Pope".
export function describeJobChange(change) {
  if (change.kind === 'added') return `added to the sheet${change.to ? ` (${change.to})` : ''}`;
  if (change.kind === 'removed') return `removed from the sheet${change.from ? ` (was ${change.from})` : ''}`;
  return `${fieldLabel(change.field)}: ${change.from || '—'} → ${change.to || '—'}`;
}

// The filter chips over the Changes feed: label → `group` in sheet-job-changes.
export const CHANGE_GROUPS = [
  { value: null, label: 'All' },
  { value: 'driver', label: 'Driver' },
  { value: 'times', label: 'Times' },
  { value: 'description', label: 'Description' },
  { value: 'seniority', label: 'Seniority' },
];
