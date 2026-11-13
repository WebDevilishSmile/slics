import dayjs from 'dayjs';

import { jobKey } from '@/lib/coverBidJobRow';
import { myCoverSpot } from '@/lib/coverDrivers';
import {
  coverJobStarts,
  jobSchedule,
  sheetJobDays,
  stopKeysOf,
  weekAssignment,
} from '@/lib/driverWeek';
import { getUpcomingSaturday } from '@/lib/format';
import { getCoverBidJobsByWeek } from '@/lib/db/coverBidJobs';
import { getCoverBidPicksSince } from '@/lib/db/coverBidPicks';
import { getDriverJob, getSheetJobRoute } from '@/lib/db/sheetJobs';
import { getSlicsByAlpha } from '@/lib/db/slics';

// A verified driver's This week card on their profile (lib/driverWeek.js):
// what they work this week and, once its pick list names them, next week,
// plus their own job on the Jobs tab. Read from what the sheet sync saved; no
// sheet read. Only for the driver themselves: `driverKey` is the
// driverNameKey of their own linked name, and the result goes through
// toDriverWeek (lib/serializers.js), which keeps other drivers out of it.
// readDriverWeek and the schedule helpers are shared with the admins' driver
// details on /admin/cover/drivers (lib/db/coverDriverProfile.js).

// One week for one driver, before its schedule is built: their place on the
// week's pick list (`picks`, a cover-bid-picks doc or null), what they work
// (weekAssignment), and the cover job they're covering with its Jobs-tab
// route when the cover tab has no description. `ownJob` is getDriverJob's row.
// → { weekEnding, posted, spot, assignment, coverJob, sheetRoute }
export async function readDriverWeek({ driverKey, weekEnding, picks, ownJob }) {
  const posted = (picks?.rows?.length ?? 0) > 0;
  const spot = posted ? myCoverSpot(picks.rows, driverKey) : null;
  const coverJobs = spot ? await getCoverBidJobsByWeek(weekEnding) : [];
  const assignment = weekAssignment({ spot, ownJobName: ownJob?.jobName ?? null, coverJobs });
  const coverJob =
    assignment.kind === 'covering'
      ? (coverJobs.find((job) => jobKey(job.jobNumber) === jobKey(assignment.jobNumber)) ?? null)
      : null;
  const sheetRoute =
    assignment.kind === 'covering' && !coverJob?.description?.trim()
      ? await getSheetJobRoute(assignment.jobNumber)
      : null;
  return { weekEnding, posted, spot, assignment, coverJob, sheetRoute };
}

// Every route description these weeks and the own job show, for one
// getSlicsByAlpha lookup.
export function weekDescriptions(ownJob, weeks) {
  return [
    ownJob?.description,
    ...weeks.flatMap((week) => [week.coverJob?.description, week.sheetRoute?.description]),
  ].filter(Boolean);
}

// The own job's schedule (the Jobs tab's days), or null.
export const ownJobSchedule = (ownJob, slicsByStop) =>
  ownJob ? jobSchedule({ ...sheetJobDays(ownJob), description: ownJob.description, slicsByStop }) : null;

// The schedule of what a read week has the driver working, or null: their own
// job's, or the cover job's.
export function weekSchedule({ assignment, coverJob, sheetRoute }, ownSchedule, slicsByStop) {
  if (assignment.kind === 'ownJob') return ownSchedule;
  if (assignment.kind !== 'covering') return null;
  if (coverJob) {
    // The week's own start times; the route from the cover tab, or the
    // Jobs tab's when the cover tab has none.
    return jobSchedule({
      starts: coverJobStarts(coverJob),
      description: coverJob.description?.trim() || sheetRoute?.description || '',
      slicsByStop,
    });
  }
  if (sheetRoute) {
    return jobSchedule({ ...sheetJobDays(sheetRoute), details: {}, description: sheetRoute.description, slicsByStop });
  }
  return null;
}

// The profile's This week card.
// → { today, ownJob: { jobName, schedule } | null, weeks: [{ weekEnding,
//     which: 'this' | 'next', posted, assignment, schedule | null }] }
export async function getDriverWeeks(driverKey, today) {
  const thisWeek = getUpcomingSaturday(dayjs(today)).format('YYYY-MM-DD');
  const nextWeek = dayjs(thisWeek).add(7, 'day').format('YYYY-MM-DD');

  const [ownJob, pickWeeks] = await Promise.all([
    getDriverJob(driverKey),
    getCoverBidPicksSince(thisWeek),
  ]);

  const weeks = [];
  for (const [weekEnding, which] of [
    [thisWeek, 'this'],
    [nextWeek, 'next'],
  ]) {
    const picks = pickWeeks.find((week) => week.weekEnding === weekEnding);
    const week = await readDriverWeek({ driverKey, weekEnding, picks, ownJob });
    // Next week only once its list names them: before that, nobody knows.
    if (which === 'next' && !week.spot) continue;
    weeks.push({ ...week, which });
  }

  // One lookup for every stop on every route shown.
  const slicsByStop = await getSlicsByAlpha(stopKeysOf(weekDescriptions(ownJob, weeks)));
  const ownSchedule = ownJobSchedule(ownJob, slicsByStop);

  return {
    today,
    ownJob: ownJob ? { jobName: ownJob.jobName, schedule: ownSchedule } : null,
    weeks: weeks.map((week) => ({
      weekEnding: week.weekEnding,
      which: week.which,
      posted: week.posted,
      assignment: week.assignment,
      schedule: weekSchedule(week, ownSchedule, slicsByStop),
    })),
  };
}
