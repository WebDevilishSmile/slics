import { formatWeekEnding } from '@/lib/onCallSheet';

// '2001-05-01-B' → '05/01/2001 · B': the hire date, then the order among
// drivers hired that day. Anything else shows as it is.
export function formatSeniority(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})-([A-Z])$/.exec(value ?? '');
  if (!match) return value || '—';
  const [, year, month, day, letter] = match;
  return `${month}/${day}/${year} · ${letter}`;
}

// Where a cover-tab driver is on their latest week (lib/driverRoster.js):
// "Cover 7 · W/E 10/24", "On call #23 · W/E 10/24".
export function coverLine(cover) {
  const week = `W/E ${formatWeekEnding(cover.weekEnding).slice(0, -5)}`;
  if (cover.kind === 'onCall') return `${cover.order ? `On call #${cover.order}` : 'On call'} · ${week}`;
  if (cover.status === 'out') {
    return `Cover ${cover.position}, out${cover.job ? ` (${cover.job})` : ''} · ${week}`;
  }
  if (cover.status === 'unnumbered') return `Cover, no number · ${week}`;
  return `Cover ${cover.position} · ${week}`;
}
