// Which tabs of the "ON CALL SHEET" the app reads, chosen by name only
// (docs/ON-CALL-SHEET-SYNC.md). Two kinds: the `Jobs` tab, and tabs whose
// whole name is a week-ending date. "ON CALL 10/10/2026", "HUB Drivers
// 10/3/2026" and "Copy of 9/19/2026" carry a date too, but aren't a week's
// cover tab, so a name must be the date and nothing else. No imports, so the
// dry-run script can load it in plain Node.

// The sheet has used every one of these over the years: 10/17/2026, 6/01/24,
// 03.04.23, 4.02.2022.
const DATE_NAME = /^\s*(\d{1,2})[/.](\d{1,2})[/.](\d{2}|\d{4})\s*$/;

// 'YYYY-MM-DD' for a real calendar date, or null.
export function isoDate(month, day, year) {
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(Date.UTC(fullYear, month - 1, day));
  if (
    date.getUTCFullYear() !== fullYear ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

export function weekEndingFromTabTitle(title) {
  const match = DATE_NAME.exec(title ?? '');
  if (!match) return null;
  return isoDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

// The first tab named for that week, in sheet order (the newest weeks sit at
// the front), or null.
export function findWeekTab(tabs, weekEnding) {
  return tabs.find((tab) => weekEndingFromTabTitle(tab.title) === weekEnding) ?? null;
}

export function findJobsTab(tabs) {
  return tabs.find((tab) => tab.title.trim().toLowerCase() === 'jobs') ?? null;
}

// '2026-10-17' → '10/17/2026', as the sheet writes it.
export function formatWeekEnding(weekEnding) {
  const [year, month, day] = weekEnding.split('-');
  return `${Number(month)}/${Number(day)}/${year}`;
}

// Today as 'YYYY-MM-DD' where the drivers are, not in the server's UTC. A week
// whose Saturday is today or later isn't over yet.
export function todayInNewYork() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

export function isSaturday(weekEnding) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekEnding ?? '')) return false;
  const [year, month, day] = weekEnding.split('-').map(Number);
  return isoDate(month, day, year) !== null && new Date(`${weekEnding}T00:00:00Z`).getUTCDay() === 6;
}

// A tab whose contents aren't laid out the way the parsers expect. Its message
// is written for the admin and is safe to show.
export class SheetFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SheetFormatError';
  }
}
