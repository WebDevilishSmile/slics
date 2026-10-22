import { isSaturday } from '@/lib/onCallSheet';

// When a cover week is bid on (docs/COVER-BIDDING.md, "Bid day"). Drivers call
// dispatch at their call-in time, the pick section's column A (a 24-hour
// 'H:MM' in the hub's time, New York), on the Thursday 9 days before the
// week's Saturday: W/E 10/24/2026 was picked on Thu 10/15 from 7:00. An admin
// can move a week's bid day (a holiday) on /admin/cover/jobs
// (`cover-bid-days`, lib/db/coverBidDays.js). Pure, so the server, the admin
// page and /covers share it.

export const BID_DAY_OFFSET_DAYS = 9;
const TIME_ZONE = 'America/New_York';
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLOT = /^\s*(\d{1,2}):(\d{2})\s*$/;

// A real 'YYYY-MM-DD' date.
export function isDate(value) {
  if (typeof value !== 'string' || !DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// 'YYYY-MM-DD' plus `days` calendar days (negative goes back).
export function addDays(date, days) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

export const defaultBidDate = (weekEnding) => addDays(weekEnding, -BID_DAY_OFFSET_DAYS);

// `overrides` is { weekEnding: bidDate } (getBidDayOverrides).
export const bidDateFor = (weekEnding, overrides) =>
  overrides?.[weekEnding] ?? defaultBidDate(weekEnding);

// The weeks whose bid day is `date` ('YYYY-MM-DD'): the usual one, 9 days on,
// unless it was moved, and any week moved to `date`. Oldest first.
export function weeksBiddingOn(date, overrides = {}) {
  const candidates = new Set([addDays(date, BID_DAY_OFFSET_DAYS), ...Object.keys(overrides)]);
  return [...candidates]
    .filter((week) => isSaturday(week) && bidDateFor(week, overrides) === date)
    .sort();
}

// A call-in slot ('9:15', '13:30') → { hours, minutes }, or null for anything
// else (an out driver's empty cell).
export function parseSlot(slot) {
  const match = SLOT.exec(typeof slot === 'string' ? slot : '');
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? { hours, minutes } : null;
}

// How far New York is from UTC at `instant`, in ms (negative: behind).
function zoneOffsetMs(instant) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instant)
      .map((part) => [part.type, Number(part.value)]),
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// The moment a driver calls in: `slot` on `bidDate`, New York time → a Date,
// or null when either can't be read. Two passes settle the offset across a
// daylight-saving change.
export function callInInstant(bidDate, slot) {
  const time = parseSlot(slot);
  if (!time || !isDate(bidDate)) return null;
  const [year, month, day] = bidDate.split('-').map(Number);
  const wall = Date.UTC(year, month - 1, day, time.hours, time.minutes);
  const first = wall - zoneOffsetMs(new Date(wall));
  return new Date(wall - zoneOffsetMs(new Date(first)));
}

// 'Thu 10/22' for a bid day.
export function formatBidDay(bidDate) {
  if (!isDate(bidDate)) return '';
  const date = new Date(`${bidDate}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date);
  return `${weekday} ${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

// A call-in reminder's lead time (COVER_REMINDER_LEADS, minutes) on its chip:
// '15 min', '1 hr', '2 hr'.
export const leadLabel = (minutes) =>
  minutes < 60 ? `${minutes} min` : `${minutes / 60} hr`;

// The time left before a call-in, in a reminder's words: '15 minutes',
// '1 hour', '1 hour 30 minutes'.
export function timeLeftWords(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (rest > 0 || hours === 0) parts.push(`${rest} minute${rest === 1 ? '' : 's'}`);
  return parts.join(' ');
}
