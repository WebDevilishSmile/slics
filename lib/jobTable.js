// Sorting for the job tables: the admins' Jobs tab on /admin/jobs
// (admin/sheetJobs/SheetJobsView.jsx) and the drivers' /jobs
// (jobs/JobsBoard.jsx). Pure.

// "15:00" or "0:09" → minutes, for sorting start times; NaN when not a time.
export const startMinutes = (value) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
};

// `columns` say what each heading sorts by: [{ key, value: (row) => …, type:
// 'text' | 'number' }]. Numbers and times sort as numbers, the rest as text;
// blank cells go last either way. `sort` is { key, direction: 'asc' | 'desc' }.
export function sortRows(rows, columns, { key, direction }) {
  const column = columns.find((c) => c.key === key);
  if (!column) return rows;
  const sign = direction === 'asc' ? 1 : -1;
  const blank = (v) => (column.type === 'number' ? Number.isNaN(v) : !v);
  return [...rows].sort((a, b) => {
    const x = column.value(a);
    const y = column.value(b);
    if (blank(x) || blank(y)) return blank(x) - blank(y);
    const order =
      column.type === 'number' ? x - y : x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
    return sign * order;
  });
}
