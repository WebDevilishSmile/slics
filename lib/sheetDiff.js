// What changed between two readings of a sheet section, field by field. Pure,
// shared by the cover picks and the jobs tab (docs/ON-CALL-SHEET-SYNC.md).

// Rows by key. A key seen twice (the same driver listed twice) gets a "#2"
// suffix so neither row is lost; both readings number them the same way.
export function keyRows(rows, keyOf) {
  const keyed = new Map();
  for (const row of rows) {
    const base = keyOf(row);
    let key = base;
    for (let n = 2; keyed.has(key); n += 1) key = `${base}#${n}`;
    keyed.set(key, row);
  }
  return keyed;
}

// `flatten(row)` turns a row into { field: string } so nested values (picks,
// day times) compare as plain strings.
export function diffByKey(oldRows, newRows, { keyOf, flatten }) {
  const before = keyRows(oldRows, keyOf);
  const after = keyRows(newRows, keyOf);
  const added = [];
  const removed = [];
  const changed = [];

  for (const [key, row] of after) {
    if (!before.has(key)) {
      added.push({ key, row });
      continue;
    }
    const from = flatten(before.get(key));
    const to = flatten(row);
    for (const field of new Set([...Object.keys(from), ...Object.keys(to)])) {
      const a = from[field] ?? '';
      const b = to[field] ?? '';
      if (a !== b) changed.push({ key, field, from: a, to: b });
    }
  }
  for (const [key, row] of before) {
    if (!after.has(key)) removed.push({ key, row });
  }

  return { added, removed, changed };
}
