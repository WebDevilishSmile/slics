import { jobKey } from '@/lib/coverBidJobRow';
import { DAY_FIELDS, normalizeDayTime } from '@/lib/dayFormat';
import { routeStops, routesByDay, stopKey } from '@/lib/jobRoutes';

// What a verified driver is working in a cover week, for the This week card on
// their profile. Pure, so the page and scratch checks share it.
//
// The week's pick list (`cover-bid-picks`) has the driver's own row (from
// myCoverSpot, lib/coverDrivers.js), and its "Job / status" column (`job`) is
// what they're working that week: a cover job's number, their own job, a
// leave (VACATION, FMLA, BUYOUT), ON CALL, COVERING ER#####, or empty while a
// cover driver has no job yet. A driver not on the list works their own job.
//
// Only the driver's own row ever reaches this, and what comes out is job
// codes, times and routes. A cover job's `name` (who picked it),
// `assignedDriver` (whose job it is) and `coverReason` (why they're off) are
// other drivers' and never leave lib/serializers.js `toDriverWeek`.

const LEAVE = /VACATION|FMLA|BUY\s*OUT|LEAVE|\bLOA\b|SICK|INJUR|HOLIDAY|\bOFF\b|RTW|PERSONAL/i;

// → { kind, … }:
//   { kind: 'ownJob', jobName }
//   { kind: 'covering', jobNumber, callIn }
//   { kind: 'off', status }
//   { kind: 'onCall', callIn }
//   { kind: 'coverUnpicked', position, callIn }
//   { kind: 'other', text }    the column says something else; shown as written
//   { kind: 'none' }           not on the list and no job on the Jobs tab
export function weekAssignment({ spot, ownJobName = null, coverJobs = [] }) {
  if (!spot) return ownJobName ? { kind: 'ownJob', jobName: ownJobName } : { kind: 'none' };

  const raw = String(spot.job ?? '').trim();
  const key = jobKey(raw);
  const callIn = spot.callIn || null;
  if (ownJobName && key === jobKey(ownJobName)) return { kind: 'ownJob', jobName: ownJobName };

  const coverJob = key && coverJobs.find((job) => jobKey(job.jobNumber) === key);
  if (coverJob) return { kind: 'covering', jobNumber: coverJob.jobNumber.trim(), callIn };
  const covering = /^COVERING\s+(\S+)/i.exec(raw);
  if (covering) return { kind: 'covering', jobNumber: covering[1].toUpperCase(), callIn };

  if (/^ON\s*-?\s*CALL$/i.test(raw) || (!raw && spot.kind === 'onCall')) return { kind: 'onCall', callIn };
  if (!raw && spot.kind === 'cover') {
    return spot.status === 'out'
      ? { kind: 'off', status: null }
      : { kind: 'coverUnpicked', position: spot.position ?? null, callIn };
  }
  if (LEAVE.test(raw)) return { kind: 'off', status: raw };
  return { kind: 'other', text: raw };
}

// A job's days as the card lists them: one entry per day of the week, Sun
// first. `starts` is { sun: 'HH:MM' | '' }; `details` the Jobs tab's { sun: {
// hours, miles } } when known; `description` the sheet's text. A day works
// when it has a start time or a route. `slicsByStop` maps stopKey → { numSlic,
// alpha } (getSlicsByAlpha, lib/db/slics.js), for links to the SLIC's card.
//   → { days: [{ day, start, hours, miles, route, stops: [{ code, numSlic,
//        alpha }], works }], description (only when it didn't parse, to show
//        as written) }
export function jobSchedule({ starts = {}, details = {}, description = '', slicsByStop = new Map() }) {
  const routes = routesByDay(description);
  const days = DAY_FIELDS.map((day) => {
    const start = normalizeDayTime(starts[day]) || null;
    const route = routes?.[day] || null;
    return {
      day,
      start,
      hours: details[day]?.hours || null,
      miles: details[day]?.miles || null,
      route,
      stops: routeStops(route).map((code) => {
        const slic = slicsByStop.get(stopKey(code));
        return { code, numSlic: slic?.numSlic ?? null, alpha: slic?.alpha ?? null };
      }),
      works: Boolean(start || route),
    };
  });
  return { days, description: routes ? null : String(description ?? '').trim() || null };
}

// Every stop code named in these descriptions, as stopKeys, for one lookup.
export function stopKeysOf(descriptions) {
  const keys = new Set();
  for (const description of descriptions) {
    for (const route of Object.values(routesByDay(description) ?? {})) {
      for (const stop of routeStops(route)) {
        const key = stopKey(stop);
        if (key) keys.add(key);
      }
    }
  }
  return [...keys];
}

// The Jobs tab's row as jobSchedule takes it: per-day starts and details.
export function sheetJobDays(sheetJob) {
  const starts = {};
  const details = {};
  for (const day of DAY_FIELDS) {
    const cell = sheetJob?.days?.[day] ?? {};
    starts[day] = cell.start ?? '';
    details[day] = { hours: cell.hours ?? null, miles: cell.miles ?? null };
  }
  return { starts, details };
}

// A cover job's row as jobSchedule takes it: its day cells are start times.
export const coverJobStarts = (coverJob) =>
  Object.fromEntries(DAY_FIELDS.map((day) => [day, coverJob?.[day] ?? '']));
