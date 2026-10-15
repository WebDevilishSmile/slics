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
//
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
    const posted = (picks?.rows?.length ?? 0) > 0;
    const spot = posted ? myCoverSpot(picks.rows, driverKey) : null;
    // Next week only once its list names them: before that, nobody knows.
    if (which === 'next' && !spot) continue;
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
    weeks.push({ weekEnding, which, posted, assignment, coverJob, sheetRoute });
  }

  // One lookup for every stop on every route shown.
  const descriptions = [
    ownJob?.description,
    ...weeks.flatMap((week) => [week.coverJob?.description, week.sheetRoute?.description]),
  ].filter(Boolean);
  const slicsByStop = await getSlicsByAlpha(stopKeysOf(descriptions));

  const ownSchedule = ownJob
    ? jobSchedule({ ...sheetJobDays(ownJob), description: ownJob.description, slicsByStop })
    : null;

  return {
    today,
    ownJob: ownJob ? { jobName: ownJob.jobName, schedule: ownSchedule } : null,
    weeks: weeks.map(({ weekEnding, which, posted, assignment, coverJob, sheetRoute }) => {
      let schedule = null;
      if (assignment.kind === 'ownJob') schedule = ownSchedule;
      if (assignment.kind === 'covering') {
        if (coverJob) {
          // The week's own start times; the route from the cover tab, or the
          // Jobs tab's when the cover tab has none.
          schedule = jobSchedule({
            starts: coverJobStarts(coverJob),
            description: coverJob.description?.trim() || sheetRoute?.description || '',
            slicsByStop,
          });
        } else if (sheetRoute) {
          schedule = jobSchedule({ ...sheetJobDays(sheetRoute), details: {}, description: sheetRoute.description, slicsByStop });
        }
      }
      return { weekEnding, which, posted, assignment, schedule };
    }),
  };
}
