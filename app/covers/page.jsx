import dayjs from 'dayjs';
import { Typography } from '@mui/material';

import { canUseCovers, canUsePush, getSession, isSuperAdmin, isVerifiedDriver } from '@/lib/authz';
import { getUserById, resolveReminderLeads } from '@/lib/db/users';
import { getMyDriverClaim } from '@/lib/db/driverClaims';
import { getMyCoverDispute } from '@/lib/db/coverDisputes';
import { getDriverJobName } from '@/lib/db/sheetJobs';
import { getCoverBidJobsSince } from '@/lib/db/coverBidJobs';
import { getCoverBidPicksSince } from '@/lib/db/coverBidPicks';
import { getBidDayOverrides } from '@/lib/db/coverBidDays';
import { getHiddenJobKeys } from '@/lib/db/coverBidJobHides';
import { getMyCoverLists } from '@/lib/db/coverPreferences';
import { getSlicByNumSlic } from '@/lib/db/slics';
import { bidDateFor, currentBidWeek } from '@/lib/bidDay';
import { isJobHidden } from '@/lib/coverBidJobRow';
import { coverListStatus } from '@/lib/coverList';
import { myCoverSpot, offListWeeks } from '@/lib/coverDrivers';
import { getUpcomingSaturday } from '@/lib/format';
import { isSaturday, todayInNewYork } from '@/lib/onCallSheet';
import { toDriverCoverJob } from '@/lib/serializers';
import { COVER_BID_MONTHS_BACK, DISPATCH_NUM_SLIC } from '@/constants';
import CoverBoard from '@/components/covers/CoverBoard';
import { PreviewLink, PreviewNotice } from '@/components/covers/CoverPreview';
import DriverVerification from '@/components/covers/DriverVerification';
import MyCoverWeeks from '@/components/covers/MyCoverWeeks';
import PageContainer from '@/components/layout/PageContainer';
import RedirectMessage from '@/components/layout/RedirectMessage';
import HydrationGuard from '@/components/utility/HydrationGuard';

// The drivers' cover page (docs/COVER-BIDDING.md, stage 1). A verified driver
// sees their own place on one week's list (cover number, call-in time): the
// week bid on this week, so from Sunday it's next week's (currentBidWeek,
// lib/bidDay.js). Then the weeks' jobs, picked ones grayed out with no name:
// toDriverCoverJob drops who took each one, so it never reaches the page.
// Jobs an admin hid (docs/COVER-JOB-HIDING.md) are left out here on the
// server, for admins too, so they're never sent. Anyone else gets the claim
// that verifies them, admins included: they test the page as drivers will
// get it.
//
// A verified driver also keeps a list of the jobs they want for each week
// (stage 2, covers/CoverBoard.jsx), with BETPA's phone (DISPATCH_NUM_SLIC)
// to call dispatch at their call-in time.
//
// A verified driver a posted week's pick list leaves off isn't a cover or
// on-call driver that week: the week is read only for them (no list, and no
// picking once stage 3 comes), and "This is a mistake" tells the admins
// (covers/CoverDispute.jsx) about the week shown. The cover list route checks
// the same rule.
//
// Admin-only while it's tested (plus anyone the super admin gave early
// access), until the Covers switch opens it (canUseCovers), checked before
// anything is read (docs/SECURITY.md #7).
//
// `?week=YYYY-MM-DD` opens the calendar on that week (every Covers
// notification links there); otherwise it opens on the week shown.
// `?preview=driver` is the super admin's preview of the page as a verified
// cover driver sees it, whether or not they're verified or on a list: each
// posted week has a placeholder place and call-in time
// (PREVIEW_SPOT), never a real driver's row (only each week's date leaves
// the picks), and the list stays in the page, unsaved. Ignored for anyone
// else.

const PREVIEW_SPOT = { kind: 'cover', position: null, status: 'preview', callIn: '' };

export default async function CoversPage({ searchParams }) {
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

  const params = (await searchParams) ?? {};
  const superAdmin = isSuperAdmin(session);
  const preview = superAdmin && params.preview === 'driver';
  const verified = isVerifiedDriver(session) && !preview;
  // A verified driver's page: the jobs, their place and their list.
  const driverView = verified || preview;
  const initialWeek = isSaturday(params.week) ? params.week : null;

  // COVER_BID_MONTHS_BACK of weeks, snapped to a Saturday so the oldest
  // week loads whole.
  const cutoffWeek = getUpcomingSaturday(
    dayjs().subtract(COVER_BID_MONTHS_BACK, 'month'),
  ).format('YYYY-MM-DD');
  const today = todayInNewYork();
  const thisWeek = getUpcomingSaturday(dayjs(today)).format('YYYY-MM-DD');
  // The one week the driver's place shows for, and the calendar opens on.
  const bidWeek = currentBidWeek(today);

  const [user, claim, jobs, hiddenKeys, pickWeeks, savedLists, dispatchPhone, dispute, bidDayOverrides] = await Promise.all([
    verified ? getUserById(session.user.id) : null,
    driverView ? null : getMyDriverClaim(session.user.id),
    driverView ? getCoverBidJobsSince(cutoffWeek) : [],
    driverView ? getHiddenJobKeys(cutoffWeek) : new Set(),
    driverView ? getCoverBidPicksSince(thisWeek) : [],
    verified ? getMyCoverLists(session.user.id, cutoffWeek) : {},
    // The button just doesn't show if the hub's SLIC can't be read.
    driverView
      ? getSlicByNumSlic(DISPATCH_NUM_SLIC).then((slic) => slic.phone || null).catch(() => null)
      : null,
    verified ? getMyCoverDispute(session.user.id) : null,
    // Weeks an admin moved off the usual Thursday (lib/bidDay.js). A failure
    // only shows the usual day.
    driverView ? getBidDayOverrides(thisWeek).catch(() => ({})) : {},
  ]);
  const driverJobs = jobs
    .filter((job) => !isJobHidden(job, hiddenKeys))
    .map(toDriverCoverJob);

  const posted = (week) => (week.rows?.length ?? 0) > 0;
  const weeks = (preview ? pickWeeks.filter(posted) : pickWeeks).map((week) => ({
    weekEnding: week.weekEnding,
    spot: preview ? PREVIEW_SPOT : myCoverSpot(week.rows ?? [], user?.driver?.key),
    bidDate: bidDateFor(week.weekEnding, bidDayOverrides),
  }));
  const bidDates = Object.fromEntries(weeks.map((week) => [week.weekEnding, week.bidDate]));
  const offWeeks = verified ? offListWeeks(pickWeeks, user?.driver?.key) : [];
  // The panel's one week, the one bid on this week, shown (as not posted
  // yet) before its picks are read too.
  const bidPicks = pickWeeks.find((week) => week.weekEnding === bidWeek && posted(week));
  const myWeek = {
    weekEnding: bidWeek,
    bidDate: bidDateFor(bidWeek, bidDayOverrides),
    posted: Boolean(bidPicks),
    spot: !bidPicks ? null : preview ? PREVIEW_SPOT : myCoverSpot(bidPicks.rows, user?.driver?.key),
  };
  // The read-only notice and "This is a mistake" are about that week only.
  const disputeWeeks = offWeeks.filter((week) => week === bidWeek);
  // The notice names the job they hold on the Jobs tab. Only their own; the
  // notice just leaves it out if it can't be read.
  const jobCode =
    disputeWeeks.length > 0
      ? await getDriverJobName(user?.driver?.key).catch((error) => {
          console.error('Error reading the driver’s job for /covers:', error);
          return null;
        })
      : null;
  // The call-in reminder said under Call dispatch, when it's on
  // (docs/PUSH-NOTIFICATIONS.md, stage 3); the default in a preview.
  const reminderOn = preview || (canUsePush(session) && user?.pushPrefs?.coverReminder !== false);
  const reminderLeads = reminderOn ? resolveReminderLeads(preview ? null : user?.coverReminderLeads) : null;
  const callIns = Object.fromEntries(
    preview
      ? weeks.map((week) => [week.weekEnding, 'your time'])
      : weeks.filter((week) => week.spot?.callIn).map((week) => [week.weekEnding, week.spot.callIn]),
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
      {preview && <PreviewNotice />}
      {superAdmin && !preview && <PreviewLink />}

      <HydrationGuard>
        {driverView ? (
          <MyCoverWeeks
            name={session.user.name ?? ''}
            driverName={user?.driver?.name ?? ''}
            week={myWeek}
            offWeeks={disputeWeeks}
            dispute={dispute}
            jobCode={jobCode}
            preview={preview}
          />
        ) : (
          <DriverVerification initialClaim={claim} />
        )}
      </HydrationGuard>

      {driverView && (
        <CoverBoard
          jobs={driverJobs}
          minWeekEnding={cutoffWeek}
          initialLists={lists}
          callIns={callIns}
          bidDates={bidDates}
          dispatchPhone={dispatchPhone}
          canList={driverView}
          offListWeeks={offWeeks}
          thisWeek={thisWeek}
          initialWeek={initialWeek ?? bidWeek}
          preview={preview}
          reminderLeads={reminderLeads}
          profileHref={`/profile/${session.user.id}`}
        />
      )}
    </PageContainer>
  );
}
