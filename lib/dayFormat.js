export const DAY_FIELDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const DAY_COLORS = {
  sun: 'warning',
  mon: 'primary',
  tue: 'secondary',
  wed: 'success',
  thu: 'info',
  fri: 'error',
  sat: 'warning',
};

export const DAY_LABELS = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

// "HH:MM" (optionally ":SS", as /bids schedules may store it) → "h:MM AM/PM".
// Anything else is passed through as-is: bid sheets put free text in cells too.
export function formatDayValue(value) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return value;
  const hour = parseInt(match[1], 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${match[2]} ${ampm}`;
}

// A bid sheet's day cell, as stored: "HH:MM" in 24-hour time, the way the
// sheet prints it, or '' when the cell is blank.
const DAY_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isDayTime(value) {
  return value === '' || DAY_TIME.test(value ?? '');
}

// Tidies a value read off a sheet into "HH:MM": "6:30", "0630", "630" and
// "06:30:00" all become "06:30". Anything else (a misread like "O6:3O") comes
// back trimmed but otherwise unchanged, so the review flags it instead of
// guessing at it.
export function normalizeDayTime(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const match = /^(\d{1,2}):?(\d{2})(?::\d{2})?$/.exec(text);
  if (!match) return text;
  const time = `${match[1].padStart(2, '0')}:${match[2]}`;
  return DAY_TIME.test(time) ? time : text;
}
