import { bidDateFor } from '@/lib/bidDay';
import { jobKey } from '@/lib/coverBidJobRow';
import { driverTrends } from '@/lib/coverHistory';
import { driverNameKey } from '@/lib/driverNames';
import { stopKeysOf } from '@/lib/driverWeek';
import { displayName } from '@/lib/names';
import { ASSIGNMENT_FIELDS, toSchedule } from '@/lib/serializers';
import { getBidDayOverrides } from '@/lib/db/coverBidDays';
import { getCoverBidJobWeeks } from '@/lib/db/coverBidJobs';
import { getCoverBidPicks } from '@/lib/db/coverBidPicks';
import { readWeeks } from '@/lib/db/coverHistory';
import {
  ownJobSchedule,
  readDriverWeek,
  weekDescriptions,
  weekSchedule,
} from '@/lib/db/driverWeeks';
import { getDriverJob } from '@/lib/db/sheetJobs';
import { getSlicsByAlpha } from '@/lib/db/slics';

// One driver as the admins' Cover Drivers page shows them when a name is
// tapped (/admin/cover/drivers, components/covers/CoverDriverDialog.jsx):
// their place and work in the week the page shows, the job they hold on the
// Jobs tab, and their last weeks on the pick lists. Read from what the sheet
// sync saved; no sheet read. Admin-only (the Covers area): it names the
// driver. It never says who picked a job or why it's open (a cover job's
// `name`, `assignedDriver`, `coverReason`).

// How many weeks bid on, up to the week shown, the Recent weeks list reads.
export const RECENT_WEEKS = 8;

const text = (value) => {
  const trimmed = String(value ?? '').trim();
  return trimmed || null;
};

const shapeAssignment = (assignment) =>
  Object.fromEntries(
    ASSIGNMENT_FIELDS.filter((key) => assignment[key] != null).map((key) => [key, assignment[key]]),
  );

// `driverKey` is a driverNameKey; `weekEnding` a Saturday 'YYYY-MM-DD'.
// → null when the driver is on none of these (the week's picks, the Jobs tab,
//   the recent weeks), else { key, name, week, ownJob, recent }:
//   week: { weekEnding, posted, bidDate, place, assignment, schedule }, where
//     place is { list: 'cover' | 'onCall', number, status, callIn } or null;
//   ownJob: { jobName, seniority, weekHours, schedule } or null;
//   recent: { weeks (newest first), totals } — each week { weekEnding,
//     hasPicks, uploaded, onList, list, place, status, kind, jobNumber, leave,
//     text }; totals are driverTrends' for this driver, or null.
export async function getCoverDriverProfile(driverKey, weekEnding) {
  const key = driverNameKey(driverKey);
  if (!key) return null;

  const [ownJob, picks, overrides, jobWeeks] = await Promise.all([
    getDriverJob(key),
    getCoverBidPicks(weekEnding),
    getBidDayOverrides(weekEnding),
    getCoverBidJobWeeks(),
  ]);

  const recentWeeks = jobWeeks.filter((week) => week <= weekEnding).slice(0, RECENT_WEEKS);
  const [week, history] = await Promise.all([
    readDriverWeek({ driverKey: key, weekEnding, picks, ownJob }),
    recentWeeks.length ? readWeeks(recentWeeks) : { read: [] },
  ]);

  const recent = [...history.read].reverse().map(({ summary, drivers }) => {
    const driver = drivers.find((entry) => entry.key === key) ?? null;
    // Cover History reads a week without knowing anyone's own job, so a pick
    // list row naming it reads as "other" there.
    const ownJobWeek =
      driver?.kind === 'other' && ownJob?.jobName && jobKey(driver.text) === jobKey(ownJob.jobName);
    return {
      weekEnding: summary.weekEnding,
      hasPicks: summary.hasPicks,
      uploaded: summary.uploaded,
      onList: Boolean(driver),
      list: driver?.list ?? null,
      place: driver?.place ?? null,
      status: driver?.status ?? null,
      kind: ownJobWeek ? 'ownJob' : (driver?.kind ?? null),
      jobNumber: driver?.jobNumber ?? null,
      leave: driver?.leave ?? null,
      text: ownJobWeek ? null : (driver?.text ?? null),
    };
  });
  const trend = driverTrends(history.read).find((entry) => entry.key === key) ?? null;

  if (!week.spot && !ownJob && !recent.some((entry) => entry.onList)) return null;

  // The latest spelling: the week shown, else the newest week they're on,
  // else the Jobs tab's.
  const sheetName =
    picks?.rows?.find((row) => driverNameKey(row.name) === key)?.name ??
    history.read
      .flatMap(({ drivers }) => drivers)
      .reverse()
      .find((entry) => entry.key === key)?.name ??
    ownJob?.driver ??
    key;

  const slicsByStop = await getSlicsByAlpha(stopKeysOf(weekDescriptions(ownJob, [week])));
  const ownSchedule = ownJobSchedule(ownJob, slicsByStop);
  const { spot } = week;

  return {
    key,
    name: displayName(sheetName),
    week: {
      weekEnding,
      posted: week.posted,
      bidDate: bidDateFor(weekEnding, overrides),
      place: spot
        ? {
            list: spot.kind,
            number: (spot.kind === 'cover' ? spot.position : spot.order) ?? null,
            status: spot.status ?? null,
            callIn: text(spot.callIn),
          }
        : null,
      assignment: shapeAssignment(week.assignment),
      schedule: toSchedule(weekSchedule(week, ownSchedule, slicsByStop)),
    },
    ownJob: ownJob
      ? {
          jobName: ownJob.jobName,
          seniority: text(ownJob.seniority),
          weekHours: text(ownJob.weekHours),
          schedule: toSchedule(ownSchedule),
        }
      : null,
    recent: {
      weeks: recent,
      totals: trend
        ? {
            weeks: trend.weeks,
            coverWeeks: trend.coverWeeks,
            onCallWeeks: trend.onCallWeeks,
            covering: trend.covering,
            coverNoJob: trend.coverNoJob,
            out: trend.out,
            avgPlace: trend.avgPlace,
          }
        : null,
    },
  };
}
