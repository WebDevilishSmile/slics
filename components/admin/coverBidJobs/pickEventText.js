// One pick-list change as a line, without the driver's name: "added to the
// list", "Time: 9:15 → 9:30". Admin-only (cover-bid-pick-events): the values
// are other drivers' places and statuses. Cover Jobs' pick section and Cover
// History's week log share it.

export function pickFieldLabel(field) {
  if (field.startsWith('pick')) return `Pick #${field.slice(4)}`;
  return { slot: 'Time', order: 'Order', job: 'Job / status' }[field] ?? field;
}

export function describePickEvent(event) {
  if (event.field === 'added') return 'added to the list';
  if (event.field === 'removed') return 'removed from the list';
  return `${pickFieldLabel(event.field)}: ${event.from || '—'} → ${event.to || '—'}`;
}
