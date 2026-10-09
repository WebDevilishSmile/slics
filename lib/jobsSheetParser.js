// Parses the "ON CALL SHEET"'s `Jobs` tab (docs/ON-CALL-SHEET-SYNC.md): one
// header row, then one row per bid job:
//
//   Job Name, Driver, Su Start, Su Hours, Su Miles, Mo Start … Sa Miles,
//   Description, Hours for Week, Seniority
//
// Columns are found by their header text, so a moved or added column doesn't
// break it. Every value stays a trimmed string, exactly as the sheet shows it.
// Pure; relative imports keep it loadable by the preview script in plain Node.
import { DAY_FIELDS } from './dayFormat.js';
import { SheetFormatError } from './onCallSheet.js';

// The sheet's two-letter day prefixes, in DAY_FIELDS order.
const DAY_PREFIXES = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
const PARTS = ['start', 'hours', 'miles'];

const label = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const cell = (row, index) => (index < 0 ? '' : String(row?.[index] ?? '').trim());

export function parseJobsTab(values) {
  const headerIndex = values.findIndex((row) => (row ?? []).some((h) => label(h) === 'job name'));
  if (headerIndex < 0) throw new SheetFormatError('No "Job Name" header row');
  const header = values[headerIndex].map(label);
  const column = (name) => header.indexOf(name);

  const columns = {
    jobName: column('job name'),
    driver: column('driver'),
    description: column('description'),
    weekHours: column('hours for week'),
    seniority: column('seniority'),
  };
  const dayColumns = Object.fromEntries(
    DAY_FIELDS.map((day, i) => [
      day,
      Object.fromEntries(PARTS.map((part) => [part, column(`${DAY_PREFIXES[i]} ${part}`)])),
    ])
  );
  const missing = ['driver', 'description'].filter((field) => columns[field] < 0);
  if (DAY_FIELDS.some((day) => dayColumns[day].start < 0)) missing.push('day start times');
  if (missing.length) {
    throw new SheetFormatError(`The header is missing ${missing.join(', ')}`);
  }

  const rows = [];
  for (const row of values.slice(headerIndex + 1)) {
    const jobName = cell(row, columns.jobName);
    if (!jobName) continue;
    rows.push({
      jobName,
      driver: cell(row, columns.driver),
      days: Object.fromEntries(
        DAY_FIELDS.map((day) => [
          day,
          Object.fromEntries(PARTS.map((part) => [part, cell(row, dayColumns[day][part])])),
        ])
      ),
      description: cell(row, columns.description),
      weekHours: cell(row, columns.weekHours),
      seniority: cell(row, columns.seniority),
    });
  }
  return rows;
}

// One flat field per value, for sheetDiff: driver, mon.start, mon.hours,
// mon.miles … description, weekHours, seniority.
export function flattenJob(row) {
  const flat = { driver: row.driver };
  for (const day of DAY_FIELDS) {
    for (const part of PARTS) flat[`${day}.${part}`] = row.days?.[day]?.[part] ?? '';
  }
  flat.description = row.description;
  flat.weekHours = row.weekHours;
  flat.seniority = row.seniority;
  return flat;
}

// The filter group a changed field belongs to, for the Changes feed.
export function fieldGroup(field) {
  if (field === 'driver') return 'driver';
  if (field === 'description') return 'description';
  if (field === 'seniority') return 'seniority';
  return 'times'; // a day's start/hours/miles, and the week's hours
}
