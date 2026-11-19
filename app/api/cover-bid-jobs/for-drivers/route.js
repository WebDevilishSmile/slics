import dayjs from 'dayjs';
import { NextResponse } from 'next/server';

import { isSuperAdmin, isVerifiedDriver, requireCovers } from '@/lib/authz';
import { getCoverBidJobsByWeek } from '@/lib/db/coverBidJobs';
import { getHiddenJobKeys } from '@/lib/db/coverBidJobHides';
import { getSheetJobWeekHours } from '@/lib/db/sheetJobs';
import { currentBidWeek } from '@/lib/bidDay';
import { isJobHidden, jobKey } from '@/lib/coverBidJobRow';
import { getUpcomingSaturday } from '@/lib/format';
import { errorResponse } from '@/lib/httpError';
import { isSaturday, todayInNewYork } from '@/lib/onCallSheet';
import { toDriverCoverJob } from '@/lib/serializers';

// One week's cover jobs as /covers shows them, for the open page to re-read
// (covers/CoverBoard.jsx): when the driver comes back to the tab, and once a
// minute on the week's bid day, so a job picked meanwhile shows as taken.
// The same rows app/covers/page.jsx sends: hidden jobs left out on the server
// and every row through toDriverCoverJob, which never says who took a job
// (CLAUDE.md, the Covers anonymity rule). Behind the page's own gate: a
// verified driver, or the super admin's preview. Creator mode answers it in
// the browser (lib/creatorFetch.js).
export async function GET(request) {
  try {
    const { session, denied } = await requireCovers();
    if (denied) return denied;
    if (!isVerifiedDriver(session) && !isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Only verified drivers see the cover jobs.' }, { status: 403 });
    }

    const week = new URL(request.url).searchParams.get('week');
    if (!isSaturday(week)) {
      return NextResponse.json({ error: 'Pick a week-ending Saturday.' }, { status: 400 });
    }

    // The Jobs tab's hours go only on this week and the week bid on, as on
    // the page.
    const today = todayInNewYork();
    const thisWeek = getUpcomingSaturday(dayjs(today)).format('YYYY-MM-DD');
    const withHours = week === thisWeek || week === currentBidWeek(today);

    const [jobs, hiddenKeys, weekHours] = await Promise.all([
      getCoverBidJobsByWeek(week),
      getHiddenJobKeys(week),
      withHours
        ? getSheetJobWeekHours().catch((error) => {
            console.error('Error reading the Jobs tab’s week hours for a cover jobs refresh:', error);
            return new Map();
          })
        : new Map(),
    ]);

    const data = jobs
      .filter((job) => !isJobHidden(job, hiddenKeys))
      .map((job) => toDriverCoverJob(job, { weekHours: weekHours.get(jobKey(job.jobNumber)) ?? '' }));
    return NextResponse.json({ success: true, data: { weekEnding: week, jobs: data } });
  } catch (error) {
    console.error('Error re-reading a week’s cover jobs for a driver:', error);
    return errorResponse(error, "Couldn't load the week's jobs.");
  }
}
