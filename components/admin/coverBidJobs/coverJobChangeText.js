import { DAY_LABELS } from '@/lib/dayFormat';

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

// One change as a line, without the week or the job: "Mon: 22:00 → 21:00".
// Admin-only (lib/db/coverJobChanges.js): it says names and cover reasons.
export function describeCoverJobChange(change) {
  if (change.kind === 'posted') return `Week posted with ${change.jobs ?? 0} job${change.jobs === 1 ? '' : 's'}`;
  if (change.kind === 'added') return `added${change.to ? ` (${change.to})` : ''}`;
  if (change.kind === 'removed') return `removed${change.from ? ` (was ${change.from})` : ''}`;
  return `${coverFieldLabel(change.field)}: ${change.from || '—'} → ${change.to || '—'}`;
}
