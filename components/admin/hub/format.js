// Formatting for the super admin hub (docs/SUPER-ADMIN-HUB.md). Times are
// shown in the drivers' zone, America/New_York, so the server's render and the
// browser's hydration print the same text (a local-zone format would differ
// between a UTC server and the phone). Intl puts a narrow no-break space before
// AM/PM in some engines and a plain one in others; it's normalized for the same
// reason.

const TIME_ZONE = 'America/New_York';

const dateTime = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const dateOnly = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const spaces = (text) => text.replace(/[  ]/g, ' ');

// "Oct 12, 3:04 PM"
export const formatWhen = (iso) => (iso ? spaces(dateTime.format(new Date(iso))) : '');
// "Oct 12, 2026"
export const formatDay = (iso) => (iso ? spaces(dateOnly.format(new Date(iso))) : '');
// 'YYYY-MM-DD' → "10/12"
export const shortDate = (key) => {
  const [, month, day] = key.split('-');
  return `${Number(month)}/${Number(day)}`;
};

const whole = new Intl.NumberFormat('en-US');
const compactFormat = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
// 1,284 under ten thousand; 12.9K from there.
export const formatCount = (value) => (value >= 10_000 ? compactFormat.format(value) : whole.format(value ?? 0));

export const plural = (count, one, many = `${one}s`) => `${formatCount(count)} ${count === 1 ? one : many}`;

export function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  } catch {
    return `${amount}${currency ? ` ${currency}` : ''}`;
  }
}
