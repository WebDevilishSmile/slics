import dayjs from 'dayjs';
import { Typography } from '@mui/material';

import { canUseCovers, getSession, isVerifiedDriver } from '@/lib/authz';
import { getUserById } from '@/lib/db/users';
import { getMyDriverClaim } from '@/lib/db/driverClaims';
import { getCoverBidJobsSince } from '@/lib/db/coverBidJobs';
import { getCoverBidPicksSince } from '@/lib/db/coverBidPicks';
import { getHiddenJobKeys } from '@/lib/db/coverBidJobHides';
import { getMyCoverLists } from '@/lib/db/coverPreferences';
import { getSlicByNumSlic } from '@/lib/db/slics';
import { isJobHidden } from '@/lib/coverBidJobRow';
import { coverListStatus } from '@/lib/coverList';
import { myCoverSpot } from '@/lib/coverDrivers';
import { getUpcomingSaturday } from '@/lib/format';
import { todayInNewYork } from '@/lib/onCallSheet';
import { toDriverCoverJob } from '@/lib/serializers';
import { COVER_BID_MONTHS_BACK, DISPATCH_NUM_SLIC } from '@/constants';
import CoverBoard from '@/components/covers/CoverBoard';
import DriverVerification from '@/components/covers/DriverVerification';
import MyCoverWeeks from '@/components/covers/MyCoverWeeks';
import PageContainer from '@/components/layout/PageContainer';
import RedirectMessage from '@/components/layout/RedirectMessage';
import HydrationGuard from '@/components/utility/HydrationGuard';

// The drivers' cover page (docs/COVER-BIDDING.md, stage 1). A verified driver
// sees their own place on the week's list (cover number, call-in time) and
// the week's jobs, picked ones grayed out with no name: toDriverCoverJob
// drops who took each one, so it never reaches the page. Jobs an admin hid
// (docs/COVER-JOB-HIDING.md) are left out here on the server, for admins too,
// so they're never sent. Anyone else gets the claim that verifies them.
// Admins also see the jobs while unverified.
//
// A verified driver also keeps a list of the jobs they want for each week
// (stage 2, covers/CoverBoard.jsx), with BETPA's phone (DISPATCH_NUM_SLIC)
// to call dispatch at their call-in time.
//
// Admin-only until it rolls out (canUseCovers, COVERS_OPEN), checked before
// anything is read (docs/SECURITY.md #7).
export default async function CoversPage() {
  const session = await getSession();
  if (!canUseCovers(session)) {
    return (
      <RedirectMessage
        heading='Covers is admin-only for now.'
        subheading='Redirecting you to the home page…'
        redirect='/home'
      />
    );
  }

  const verified = isVerifiedDriver(session);
  const showJobs = verified || session.user.role === 'admin';

  // The same window as /cover-bid-jobs, snapped to a Saturday so the oldest
  // week loads whole.
  const cutoffWeek = getUpcomingSaturday(
    dayjs().subtract(COVER_BID_MONTHS_BACK, 'month'),
  ).format('YYYY-MM-DD');
  const thisWeek = getUpcomingSaturday(dayjs(todayInNewYork())).format('YYYY-MM-DD');

  const [user, claim, jobs, hiddenKeys, pickWeeks, savedLists, dispatchPhone] = await Promise.all([
    verified ? getUserById(session.user.id) : null,
    verified ? null : getMyDriverClaim(session.user.id),
    showJobs ? getCoverBidJobsSince(cutoffWeek) : [],
    showJobs ? getHiddenJobKeys(cutoffWeek) : new Set(),
    verified ? getCoverBidPicksSince(thisWeek) : [],
    verified ? getMyCoverLists(session.user.id, cutoffWeek) : {},
    // The button just doesn't show if the hub's SLIC can't be read.
    verified
      ? getSlicByNumSlic(DISPATCH_NUM_SLIC).then((slic) => slic.phone || null).catch(() => null)
      : null,
  ]);
  const driverJobs = jobs
    .filter((job) => !isJobHidden(job, hiddenKeys))
    .map(toDriverCoverJob);

  const weeks = pickWeeks.map((week) => ({
    weekEnding: week.weekEnding,
    spot: myCoverSpot(week.rows ?? [], user?.driver?.key),
  }));
  const callIns = Object.fromEntries(
    weeks.filter((week) => week.spot?.callIn).map((week) => [week.weekEnding, week.spot.callIn]),
  );
  // Each saved list with where its jobs stand now (open, picked, gone).
  const lists = Object.fromEntries(
    Object.entries(savedLists).map(([weekEnding, entries]) => [
      weekEnding,
      coverListStatus(
        entries,
        jobs.filter((job) => job.weekEnding === weekEnding),
        weekEnding,
        hiddenKeys,
      ),
    ]),
  );

  return (
    <PageContainer>
      <Typography variant='sectionHeading'>Covers</Typography>

      <HydrationGuard>
        {verified ? (
          <MyCoverWeeks
            name={session.user.name ?? ''}
            driverName={user?.driver?.name ?? ''}
            weeks={weeks}
          />
        ) : (
          <DriverVerification initialClaim={claim} />
        )}
      </HydrationGuard>

      {showJobs && (
        <CoverBoard
          jobs={driverJobs}
          minWeekEnding={cutoffWeek}
          initialLists={lists}
          callIns={callIns}
          dispatchPhone={dispatchPhone}
          canList={verified}
          thisWeek={thisWeek}
        />
      )}
    </PageContainer>
  );
}
