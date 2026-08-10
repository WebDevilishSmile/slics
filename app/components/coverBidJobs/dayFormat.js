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

export function formatDayValue(value) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const hour = parseInt(match[1], 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${match[2]} ${ampm}`;
}
