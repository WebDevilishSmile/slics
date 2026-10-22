import { ObjectId } from 'mongodb';

import { addDays, bidDateFor, callInInstant, weeksBiddingOn } from '@/lib/bidDay';
import { isJobHidden } from '@/lib/coverBidJobRow';
import { myCoverSpot } from '@/lib/coverDrivers';
import { coverListStatus } from '@/lib/coverList';
import { DAY_FIELDS } from '@/lib/dayFormat';
import { todayInNewYork } from '@/lib/onCallSheet';
import { sendCoverCallIns, sendCoverReminders, sendCoverWeekJobs, spotWords } from '@/lib/pushEvents';
import { getCoverBidJobsByWeek } from '@/lib/db/coverBidJobs';
import { getHiddenJobKeys } from '@/lib/db/coverBidJobHides';
import { getBidDayOverrides } from '@/lib/db/coverBidDays';
import { getCoverBidPicks, getCoverBidPicksSince } from '@/lib/db/coverBidPicks';
import { getCoverJobChangeRowsSince } from '@/lib/db/coverJobChanges';
import {
  claimNotice,
  getNotice,
  getNotices,
  moveNotice,
  noticeExpiresAt,
} from '@/lib/db/coverNotices';
import { getWeekListEntries } from '@/lib/db/coverPreferences';
import { getCoverDriverAudience, getPushAudience } from '@/lib/db/users';

// The Covers notifications that come from the clock, not from a request
// (docs/PUSH-NOTIFICATIONS.md, stage 3). GET /api/cron/cover-notifications
// runs them every minute (vercel.json). Each decides who's told what, from
// what the sheet sync saved, and records it in `cover-notices` before or as
// it sends (lib/db/coverNotices.js), so a run that comes twice, or two runs
// at once, tell nobody twice. The words are lib/pushEvents.js's. A push is
// only a nudge: /covers is where everything is (the ground rules).

// A week's places and call-in times must have stopped changing this long
// before anyone is told theirs: renumbering one driver moves everyone after
// them, edit by edit, and each driver should hear once, with the final time.
export const CALL_IN_QUIET_MINUTES = 30;
// A week's jobs, the same, so a burst of edits on the sheet is one
// notification.
export const WEEK_JOBS_QUIET_MINUTES = 10;
// How far back the week notices look, at most.
const LOOKBACK_DAYS = 14;
const MINUTE = 60_000;

const userObjectId = (id) => new ObjectId(id);

// The open jobs on a driver's list, in their order, by job number.
function openList(entries, jobs, weekEnding, hiddenKeys) {
  return coverListStatus(entries ?? [], jobs, weekEnding, hiddenKeys)
    .filter((entry) => entry.status === 'open')
    .map((entry) => entry.jobNumber);
}

// --- Call-in reminders ---

// On a bid day, each verified driver with "Call-in reminder" on is reminded
// at each time they chose before their call-in (users.coverReminderLeads).
// Every lead that's due is claimed first; one push says the nearest, so a
// missed run doesn't send two at once. A driver who's out that week, or has
// no time on the sheet, gets none. → { weeks, sent }.
export async function runCoverReminders(now = new Date()) {
  const today = todayInNewYork(now);
  // A bid day is at least a week before its week ends.
  const overrides = await getBidDayOverrides(addDays(today, 7));
  const weeks = weeksBiddingOn(today, overrides);
  if (weeks.length === 0) return { weeks: 0, sent: 0 };
  const drivers = await getCoverDriverAudience('coverReminder');
  if (drivers.length === 0) return { weeks: weeks.length, sent: 0 };

  let sent = 0;
  for (const weekEnding of weeks) {
    const rows = (await getCoverBidPicks(weekEnding))?.rows ?? [];
    if (rows.length === 0) continue;

    const due = [];
    for (const driver of drivers) {
      const spot = myCoverSpot(rows, driver.driverKey);
      if (!spot || spot.status === 'out') continue;
      const callIn = callInInstant(today, spot.callIn);
      if (!callIn || now >= callIn) continue;
      const leads = driver.leads.filter((lead) => callIn.getTime() - lead * MINUTE <= now.getTime());
      if (leads.length > 0) due.push({ driver, spot, callIn, leads, slot: spot.callIn.trim() });
    }
    if (due.length === 0) continue;

    const claimed = [];
    for (const item of due) {
      const wins = await Promise.all(
        item.leads.map((lead) =>
          claimNotice(`reminder:${item.driver.id}:${weekEnding}:${lead}:${item.slot}`, {
            kind: 'reminder',
            userId: userObjectId(item.driver.id),
            weekEnding,
            lead,
            slot: item.slot,
            expiresAt: noticeExpiresAt(weekEnding),
          }),
        ),
      );
      if (wins.some(Boolean)) claimed.push(item);
    }
    if (claimed.length === 0) continue;

    const [lists, jobs, hiddenKeys] = await Promise.all([
      getWeekListEntries(weekEnding),
      getCoverBidJobsByWeek(weekEnding),
      getHiddenJobKeys(weekEnding),
    ]);
    const reminders = new Map(
      claimed.map(({ driver, spot, callIn, slot }) => [
        driver.id,
        {
          slot,
          spot,
          minutesLeft: Math.max(1, Math.ceil((callIn.getTime() - now.getTime()) / MINUTE)),
          list: openList(lists.get(driver.id), jobs, weekEnding, hiddenKeys),
        },
      ]),
    );
    sent += (await sendCoverReminders(weekEnding, reminders)).sent;
  }
  return { weeks: weeks.length, sent };
}

// --- Call-in notices ---

// What a driver is told about their place on a week's pick list, as one
// string to compare with what they were told last: their place, its status,
// their call-in time and the bid day. 'off' when the list doesn't name them.
function callInState(spot, bidDate) {
  if (!spot) return 'off';
  return [spotWords(spot), spot.status ?? spot.kind, spot.callIn?.trim() ?? '', bidDate].join('|');
}

// For every posted week whose bid day hasn't passed and whose places have
// been quiet for CALL_IN_QUIET_MINUTES, each verified driver with "Your
// call-in time" on is told when the list first names them, and when their
// place, time or bid day changes, or the list stops naming them. A notice
// whose call-in has already passed is recorded but not sent. → { weeks, sent }.
export async function runCallInNotices(now = new Date()) {
  const today = todayInNewYork(now);
  const quietSince = new Date(now.getTime() - CALL_IN_QUIET_MINUTES * MINUTE).toISOString();
  const [overrides, pickWeeks] = await Promise.all([
    getBidDayOverrides(today),
    getCoverBidPicksSince(today),
  ]);
  const weeks = pickWeeks.filter(
    (week) =>
      (week.rows?.length ?? 0) > 0 &&
      bidDateFor(week.weekEnding, overrides) >= today &&
      (!week.slotsChangedAt || week.slotsChangedAt <= quietSince),
  );
  if (weeks.length === 0) return { weeks: 0, sent: 0 };
  const drivers = await getCoverDriverAudience('coverCallIn');
  if (drivers.length === 0) return { weeks: weeks.length, sent: 0 };

  let sent = 0;
  for (const week of weeks) {
    const { weekEnding } = week;
    const bidDate = bidDateFor(weekEnding, overrides);
    const keyOf = (driver) => `callIn:${driver.id}:${weekEnding}`;
    const told = await getNotices(drivers.map(keyOf));
    const notices = new Map();

    for (const driver of drivers) {
      const spot = myCoverSpot(week.rows, driver.driverKey);
      const state = callInState(spot, bidDate);
      const key = keyOf(driver);
      const last = told.get(key);
      if (last?.state === state || (!last && !spot)) continue;

      const wins = last
        ? await moveNotice(key, { state: last.state }, { state })
        : await claimNotice(key, {
            kind: 'callIn',
            userId: userObjectId(driver.id),
            weekEnding,
            state,
            expiresAt: noticeExpiresAt(weekEnding),
          });
      const slot = spot?.callIn?.trim() ?? '';
      const callIn = callInInstant(bidDate, slot);
      const passed = Boolean(callIn) && callIn <= now;
      if (!wins || passed) continue;
      notices.set(driver.id, { bidDate, slot, spot, change: !last ? 'new' : spot ? 'moved' : 'off' });
    }
    if (notices.size > 0) sent += (await sendCoverCallIns(weekEnding, notices)).sent;
  }
  return { weeks: weeks.length, sent };
}

// --- A week's jobs ---

const DRIVER_FIELDS = new Set([...DAY_FIELDS, 'description']);

// Of a week's change rows, the ones drivers may be told: a job added or
// removed, or its times or description changed. Never a pick (that's "Your
// list"), an assigned driver or a cover reason, and never a job drivers can't
// see (hidden in the sheet, a sleeper job, or one an admin hid).
export function coverWeekRowsForDrivers(rows, weekEnding, hiddenKeys = new Set()) {
  return rows.filter((row) => {
    const shown =
      row.kind === 'added' ||
      row.kind === 'removed' ||
      (row.kind === 'changed' && DRIVER_FIELDS.has(row.field));
    return shown && !row.sheetHidden && !isJobHidden({ jobNumber: row.jobNumber, weekEnding }, hiddenKeys);
  });
}

// Each week from this one on whose jobs changed and then stayed quiet for
// WEEK_JOBS_QUIET_MINUTES: the verified drivers with "Cover jobs" on are told
// what changed since they were last told about it (or that it was posted).
// Not a driver the week's posted pick list leaves off, and not an admin who
// gets the admin "Cover jobs" kind, which says more. The first run only
// marks where it starts. → { weeks, sent }.
export async function runCoverWeekNotices(now = new Date()) {
  const baseline = await getNotice('weeks:baseline');
  if (!baseline) {
    await claimNotice('weeks:baseline', { kind: 'baseline', through: now.toISOString() });
    return { weeks: 0, sent: 0, baseline: true };
  }
  const today = todayInNewYork(now);
  const quietSince = new Date(now.getTime() - WEEK_JOBS_QUIET_MINUTES * MINUTE).toISOString();
  const lookback = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * MINUTE).toISOString();
  const since = baseline.through > lookback ? baseline.through : lookback;
  const rows = await getCoverJobChangeRowsSince(since, today);
  if (rows.length === 0) return { weeks: 0, sent: 0 };

  const byWeek = new Map();
  for (const row of rows) byWeek.set(row.weekEnding, [...(byWeek.get(row.weekEnding) ?? []), row]);
  const markers = await getNotices([...byWeek.keys()].map((weekEnding) => `week:${weekEnding}`));

  let drivers = null;
  let admins = null;
  let sent = 0;
  for (const [weekEnding, weekRows] of byWeek) {
    const key = `week:${weekEnding}`;
    const marker = markers.get(key);
    const fresh = weekRows.filter((row) => row.seenAt > (marker?.through ?? since));
    // Newest first: wait while the week is still changing.
    if (fresh.length === 0 || fresh[0].seenAt > quietSince) continue;
    const wins = marker
      ? await moveNotice(key, { through: marker.through }, { through: fresh[0].seenAt })
      : await claimNotice(key, {
          kind: 'week',
          weekEnding,
          through: fresh[0].seenAt,
          expiresAt: noticeExpiresAt(weekEnding),
        });
    if (!wins) continue;

    const hiddenKeys = await getHiddenJobKeys(weekEnding);
    let posted = null;
    if (fresh.some((row) => row.kind === 'posted')) {
      const jobs = await getCoverBidJobsByWeek(weekEnding);
      posted = jobs.filter((job) => !isJobHidden(job, hiddenKeys)).length;
      if (posted === 0) continue;
    }
    const shown = coverWeekRowsForDrivers(fresh, weekEnding, hiddenKeys);
    if (posted === null && shown.length === 0) continue;

    drivers ??= await getCoverDriverAudience('coverWeekJobs');
    admins ??= new Set(await getPushAudience('coverJobs'));
    const pickRows = (await getCoverBidPicks(weekEnding))?.rows ?? [];
    const ids = drivers
      .filter((driver) => !admins.has(driver.id))
      .filter((driver) => pickRows.length === 0 || myCoverSpot(pickRows, driver.driverKey))
      .map((driver) => driver.id);
    if (ids.length > 0) sent += (await sendCoverWeekJobs(weekEnding, ids, shown, posted)).sent;
  }
  return { weeks: byWeek.size, sent };
}

// --- The cron ---

async function guarded(name, run) {
  try {
    return await run();
  } catch (error) {
    console.error(`Error in the Covers notifications (${name}):`, error);
    return { error: true };
  }
}

// What GET /api/cron/cover-notifications runs each minute: the reminders,
// and every fifth minute the call-in and week notices (`all` runs all three
// now, for a manual check). One failing doesn't stop the others.
export async function runCoverNotifications(now = new Date(), { all = false } = {}) {
  const results = { reminders: await guarded('reminders', () => runCoverReminders(now)) };
  if (all || now.getUTCMinutes() % 5 === 0) {
    results.callIns = await guarded('call-in notices', () => runCallInNotices(now));
    results.weekJobs = await guarded('week notices', () => runCoverWeekNotices(now));
  }
  return results;
}
