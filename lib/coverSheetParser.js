// Parses one week's cover tab of the "ON CALL SHEET" (docs/ON-CALL-SHEET-SYNC.md):
//
//   JOBS AVAILABLE FOR W/E 10.17.2026
//   Job #, NAME, Assigned Driver, Cover Reason, Sun … Sat, Description   ← job section
//   …rows…
//   (blank row)
//   , NAME, , , PICK #1 … PICK #7                                       ← pick section
//   7:30, "LAST, FIRST", 3, LV57, LV57, BEU3, …
//
// Headers are found by their text, never by row or column number, so an
// inserted row or column doesn't break it. Pure; the relative import keeps it
// loadable by the dry-run script in plain Node.
import { DAY_FIELDS, normalizeDayTime } from './dayFormat.js';
import { SheetFormatError, isoDate } from './onCallSheet.js';

const TITLE = /JOBS AVAILABLE FOR W\/E\s*(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/i;
const PICK_HEADER = /^PICK\s*#?\s*(\d+)$/i;

const cell = (row, index) => (index < 0 ? '' : String(row?.[index] ?? '').trim());
const blank = (row) => !row || row.every((value) => String(value ?? '').trim() === '');
const label = (value) => String(value ?? '').trim().toLowerCase();

// The sheet's day headers are Sun, Mon, Tues, Wed, Thurs, Fri, Sat.
function dayField(header) {
  const prefix = label(header).slice(0, 3);
  return DAY_FIELDS.includes(prefix) ? prefix : null;
}

function findTitleWeek(values) {
  for (const row of values.slice(0, 5)) {
    for (const value of row ?? []) {
      const match = TITLE.exec(String(value ?? ''));
      if (match) {
        return isoDate(Number(match[1]), Number(match[2]), Number(match[3]));
      }
    }
  }
  return null;
}

function parseJobs(values, headerIndex) {
  const header = values[headerIndex];
  const columns = {
    jobNumber: header.findIndex((h) => label(h) === 'job #'),
    name: header.findIndex((h) => label(h) === 'name'),
    assignedDriver: header.findIndex((h) => label(h) === 'assigned driver'),
    coverReason: header.findIndex((h) => label(h) === 'cover reason'),
    description: header.findIndex((h) => label(h) === 'description'),
  };
  header.forEach((h, index) => {
    const day = dayField(h);
    if (day && columns[day] === undefined) columns[day] = index;
  });
  const missing = ['jobNumber', ...DAY_FIELDS].filter((field) => !(columns[field] >= 0));
  if (missing.length) {
    throw new SheetFormatError(`The job header is missing ${missing.join(', ')}`);
  }

  const jobs = [];
  let index = headerIndex + 1;
  // The job section ends at the first blank row.
  for (; index < values.length && !blank(values[index]); index += 1) {
    const row = values[index];
    const job = {
      jobNumber: cell(row, columns.jobNumber),
      name: cell(row, columns.name),
      assignedDriver: cell(row, columns.assignedDriver),
      coverReason: cell(row, columns.coverReason),
      description: cell(row, columns.description),
    };
    for (const day of DAY_FIELDS) job[day] = normalizeDayTime(cell(row, columns[day]));
    jobs.push(job);
  }
  return jobs;
}

function parsePicks(values, headerIndex) {
  const header = values[headerIndex];
  const pickColumns = header
    .map((h, index) => ({ number: Number(PICK_HEADER.exec(String(h ?? '').trim())?.[1]), index }))
    .filter(({ number }) => number > 0)
    .sort((a, b) => a.number - b.number)
    .map(({ index }) => index);
  const nameColumn = header.findIndex((h) => label(h) === 'name');
  if (nameColumn < 0) throw new SheetFormatError('The pick header has no NAME column');

  // Unlabeled columns, by position: the pick time slot before NAME, the pick
  // order right after it, and the driver's own job (or a status like
  // VACATION or "on call") just before PICK #1.
  const slotColumn = nameColumn > 0 ? 0 : -1;
  const orderColumn = nameColumn + 1 < pickColumns[0] ? nameColumn + 1 : -1;
  const jobColumn = pickColumns[0] - 1 > orderColumn ? pickColumns[0] - 1 : -1;

  const picks = [];
  for (const row of values.slice(headerIndex + 1)) {
    const name = cell(row, nameColumn);
    if (!name) continue;
    picks.push({
      slot: cell(row, slotColumn),
      name,
      order: cell(row, orderColumn),
      job: cell(row, jobColumn),
      picks: pickColumns.map((column) => cell(row, column)),
    });
  }
  return picks;
}

// → { weekEnding, jobs, picks }. `weekEnding` is the date in the title row,
// for the caller to check against the tab's name.
export function parseCoverTab(values) {
  const weekEnding = findTitleWeek(values);
  if (!weekEnding) {
    throw new SheetFormatError('No "JOBS AVAILABLE FOR W/E" title in the first rows');
  }

  const jobHeader = values.findIndex((row) => (row ?? []).some((h) => label(h) === 'job #'));
  if (jobHeader < 0) throw new SheetFormatError('No "Job #" header row');
  const jobs = parseJobs(values, jobHeader);

  const pickHeader = values.findIndex(
    (row, index) => index > jobHeader && (row ?? []).some((h) => PICK_HEADER.test(String(h ?? '').trim()))
  );
  const picks = pickHeader < 0 ? [] : parsePicks(values, pickHeader);

  return { weekEnding, jobs, picks };
}

// One flat field per value, for sheetDiff. Picks are pick1…pick7.
export function flattenPick(row) {
  const flat = { slot: row.slot, order: row.order, job: row.job };
  row.picks.forEach((pick, index) => {
    flat[`pick${index + 1}`] = pick;
  });
  return flat;
}
