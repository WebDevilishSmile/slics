// The week's cover and on-call drivers, read from the pick section the app
// already saves (`cover-bid-picks`, docs/ON-CALL-SHEET-SYNC.md). No extra sheet
// read.
//
// The rule, from the sheet's owner (2026-10-10): pick order 1–20 are the cover
// drivers, and everyone listed after driver 20 is on call. The yellow fill
// isn't reliable (some weeks only 15 rows are yellow), so only the numbers
// count.
//
// Drivers who are out (vacation, FMLA, buyout) have no number. Since the
// 10/17/2026 tab, a cover driver who's out keeps their place and their number
// is skipped: 4, (no number), 6. Older tabs just list them unnumbered between
// numbers that don't skip, next to unnumbered names in red.

export const COVER_POSITIONS = 20;

function orderOf(row) {
  const order = String(row.order ?? '').trim();
  return /^\d+$/.test(order) ? Number(order) : null;
}

const entry = (row, position, status) => ({
  position,
  name: row.name,
  callIn: row.slot,
  job: row.job,
  status,
});

// → { cover, onCall }, both in sheet order.
//
// `cover` is every row up to driver 20: { position, name, callIn, job, status }.
//   'in':         numbered this week.
//   'out':        unnumbered, filling a skipped number (the newer layout).
//   'unnumbered': unnumbered inside the block without a skipped number to
//                 fill (the older layout); `position` is null.
//   'vacant':     a skipped number nothing clearly fills; only `position`.
// Unnumbered rows fill skipped numbers only when they match one for one.
//
// `onCall` is every row after driver 20: { order, name, callIn, job }, with
// `order` null for an unnumbered row. On 10/24/2026, 20 is skipped and three
// red names sit in its gap; they go here and position 20 shows as vacant.
export function coverDriversFromPicks(rows, positions = COVER_POSITIONS) {
  const cover = [];
  let last = 0;
  let pending = [];
  let index = 0;

  const vacancies = (from, to) => {
    for (let position = from; position <= to; position += 1) {
      cover.push({ position, name: '', callIn: '', job: '', status: 'vacant' });
    }
  };
  // Settle the unnumbered rows since `last`, now that `next` ends their gap.
  // Returns the rows it didn't place.
  const settle = (next, { final = false } = {}) => {
    const skipped = Math.min(next, positions + 1) - last - 1;
    if (skipped > 0 && pending.length === skipped) {
      pending.forEach((row, offset) => cover.push(entry(row, last + offset + 1, 'out')));
      pending = [];
      return [];
    }
    const left = final ? pending : [];
    if (!final) pending.forEach((row) => cover.push(entry(row, null, 'unnumbered')));
    if (skipped > 0) vacancies(last + 1, last + skipped);
    pending = [];
    return left;
  };

  for (; index < rows.length; index += 1) {
    const row = rows[index];
    const order = orderOf(row);
    if (order === null) {
      pending.push(row);
      continue;
    }
    if (order > positions) break;
    settle(order);
    cover.push(entry(row, order, 'in'));
    last = Math.max(last, order);
    if (order === positions) {
      index += 1;
      break;
    }
  }

  // Ran past the block without a driver 20: the last gap is ambiguous unless
  // it fills exactly, and whatever it doesn't place is on call.
  const unplaced = last < positions ? settle(Infinity, { final: true }) : [];

  const onCall = [...unplaced, ...rows.slice(index)].map((row) => ({
    order: orderOf(row),
    name: row.name,
    callIn: row.slot,
    job: row.job,
  }));

  return { cover, onCall };
}
