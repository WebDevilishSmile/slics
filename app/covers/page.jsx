import dayjs from 'dayjs';
import { Typography } from '@mui/material';

import { canUseCovers, getSession, isVerifiedDriver } from '@/lib/authz';
import { getUserById } from '@/lib/db/users';
import { getMyDriverClaim } from '@/lib/db/driverClaims';
import { getMyCoverDispute } from '@/lib/db/coverDisputes';
import { getDriverJobName } from '@/lib/db/sheetJobs';
import { getCoverBidJobsSince } from '@/lib/db/coverBidJobs';
import { getCoverBidPicksSince } from '@/lib/db/coverBidPicks';
import { getHiddenJobKeys } from '@/lib/db/coverBidJobHides';
import { getMyCoverLists } from '@/lib/db/coverPreferences';
import { getSlicByNumSlic } from '@/lib/db/slics';
import { isJobHidden } from '@/lib/coverBidJobRow';
import { coverListStatus } from '@/lib/coverList';
import { myCoverSpot, offListWeeks } from '@/lib/coverDrivers';
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
// so they're never sent. Anyone else gets the claim that verifies them,
// admins included: they test the page as drivers will get it.
//
// A verified driver also keeps a list of the jobs they want for each week
// (stage 2, covers/CoverBoard.jsx), with BETPA's phone (DISPATCH_NUM_SLIC)
// to call dispatch at their call-in time.
//
// A verified driver a posted week's pick list leaves off isn't a cover or
// on-call driver that week: the week is read only for them (no list, and no
// picking once stage 3 comes), and "This is a mistake" tells the admins
// (covers/CoverDispute.jsx). The cover list route checks the same rule.
//
// Admin-only while it's tested (plus anyone the super admin gave early
// access), until the Covers switch opens it (canUseCovers), checked before
// anything is read (docs/SECURITY.md #7).
export default async function CoversPage() {
  const session = await getSession();
  if (!canUseCovers(session)) {
    return (
      <RedirectMessage
        heading="Covers isn't open to every driver yet."
        subheading='Redirecting you to the home page…'
        redirect='/home'
      />
    );
  }

  const verified = isVerifiedDriver(session);

  // COVER_BID_MONTHS_BACK of weeks, snapped to a Saturday so the oldest
  // week loads whole.
  const cutoffWeek = getUpcomingSaturday(
    dayjs().subtract(COVER_BID_MONTHS_BACK, 'month'),
  ).format('YYYY-MM-DD');
  const thisWeek = getUpcomingSaturday(dayjs(todayInNewYork())).format('YYYY-MM-DD');

  const [user, claim, jobs, hiddenKeys, pickWeeks, savedLists, dispatchPhone, dispute] = await Promise.all([
    verified ? getUserById(session.user.id) : null,
    verified ? null : getMyDriverClaim(session.user.id),
    verified ? getCoverBidJobsSince(cutoffWeek) : [],
    verified ? getHiddenJobKeys(cutoffWeek) : new Set(),
    verified ? getCoverBidPicksSince(thisWeek) : [],
    verified ? getMyCoverLists(session.user.id, cutoffWeek) : {},
    // The button just doesn't show if the hub's SLIC can't be read.
    verified
      ? getSlicByNumSlic(DISPATCH_NUM_SLIC).then((slic) => slic.phone || null).catch(() => null)
      : null,
    verified ? getMyCoverDispute(session.user.id) : null,
  ]);
  const driverJobs = jobs
    .filter((job) => !isJobHidden(job, hiddenKeys))
    .map(toDriverCoverJob);

  const weeks = pickWeeks.map((week) => ({
    weekEnding: week.weekEnding,
    spot: myCoverSpot(week.rows ?? [], user?.driver?.key),
  }));
  const offWeeks = verified ? offListWeeks(pickWeeks, user?.driver?.key) : [];
  const postedWeeks = pickWeeks.filter((week) => (week.rows?.length ?? 0) > 0).length;
  // The read-only notice names the job they hold on the Jobs tab. Only their
  // own; the notice just leaves it out if it can't be read.
  const jobCode =
    offWeeks.length > 0
      ? await getDriverJobName(user?.driver?.key).catch((error) => {
          console.error('Error reading the driver’s job for /covers:', error);
          return null;
        })
      : null;
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
            offWeeks={offWeeks}
            allOff={offWeeks.length > 0 && offWeeks.length === postedWeeks}
            dispute={dispute}
            jobCode={jobCode}
          />
        ) : (
          <DriverVerification initialClaim={claim} />
        )}
      </HydrationGuard>

      {verified && (
        <CoverBoard
          jobs={driverJobs}
          minWeekEnding={cutoffWeek}
          initialLists={lists}
          callIns={callIns}
          dispatchPhone={dispatchPhone}
          canList={verified}
          offListWeeks={offWeeks}
          thisWeek={thisWeek}
        />
      )}
    </PageContainer>
  );
}
