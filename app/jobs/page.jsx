import { Paper, Typography } from '@mui/material';

import { canUseCovers, canUseJobs, getCreatorMode, getSession } from '@/lib/authz';
import { creatorJobs } from '@/lib/creatorData';
import { getSheetJobs } from '@/lib/db/sheetJobs';
import { getSlicsByAlpha } from '@/lib/db/slics';
import { getUserById } from '@/lib/db/users';
import { driverNameKey } from '@/lib/driverNames';
import { stopKeysOf } from '@/lib/driverWeek';
import { toDriverSheetJob } from '@/lib/serializers';
import { JOBS_OPEN } from '@/constants';
import theme from '@/theme';
import CreatorMode from '@/components/creator/CreatorMode';
import JobsBoard from '@/components/jobs/JobsBoard';
import PageContainer from '@/components/layout/PageContainer';
import RedirectMessage from '@/components/layout/RedirectMessage';

// The drivers' Jobs page (docs/JOBS-PAGE.md): every bid job on the on-call
// sheet's Jobs tab, as the sync saved it (`sheet-jobs`,
// docs/ON-CALL-SHEET-SYNC.md stage 2), with its start times, route, week
// hours and the seniority number of the driver who holds it. Never a name:
// toDriverSheetJob (lib/serializers.js) names every field that leaves the
// server and the `driver` cell isn't one. A verified driver's own job is
// marked "Your job", worked out here from their own linked name.
//
// Staff with the Jobs tool only while it's tested (they see the same jobs
// with names on /admin/jobs), until the super admin's "Jobs for verified
// drivers" switch opens it to every verified driver (canUseJobs), checked
// before anything is read (docs/SECURITY.md #7).
//
// The page asks the server nothing after it loads: a job's details are worked
// out in the browser from what's sent here (jobs/JobDialog.jsx). A route
// added later needs a requireJobs() gate and a made-up answer in creator mode
// (lib/creatorFetch.js).

const panelSx = {
  maxWidth: theme.layout.width.page,
  minHeight: 0,
  alignItems: 'stretch',
  my: 2,
  px: { xs: 1.5, md: 3 },
  py: 3,
};

export default async function JobsPage() {
  const session = await getSession();
  if (!canUseJobs(session)) {
    // Open, but this account isn't a verified driver: Covers is where a
    // driver asks to be verified.
    const needsVerifying =
      Boolean(session) && (session.features?.jobsOpen ?? JOBS_OPEN) && canUseCovers(session);
    return needsVerifying ? (
      <RedirectMessage
        heading='Jobs is for verified drivers.'
        subheading='Taking you to Covers, where you can ask to be verified…'
        redirect='/covers'
      />
    ) : (
      <RedirectMessage
        heading="Jobs isn't open to drivers yet."
        subheading='Redirecting you to the home page…'
        redirect='/home'
      />
    );
  }

  // Creator mode (docs/CREATOR-MODE.md): made-up jobs and seniority numbers,
  // with nothing read from the database.
  if (await getCreatorMode(session)) {
    const { jobs, stops } = creatorJobs();
    return (
      <PageContainer>
        <CreatorMode />
        <Typography variant='sectionHeading'>Jobs</Typography>
        <Paper variant='panel' sx={panelSx}>
          <JobsBoard jobs={jobs} stops={stops} />
        </Paper>
      </PageContainer>
    );
  }

  const [jobs, user] = await Promise.all([
    getSheetJobs(),
    // Only to mark the reader's own job.
    session.user.driverVerified ? getUserById(session.user.id) : null,
  ]);
  // The routes' stops that are SLICs, for links to their cards. The page just
  // shows the stops as text if they can't be read.
  const slicsByStop = await getSlicsByAlpha(stopKeysOf(jobs.map((job) => job.description))).catch(
    (error) => {
      console.error('Error reading the SLICs on the jobs’ routes for /jobs:', error);
      return new Map();
    },
  );

  // A driver holds one job; if the sheet lists them twice, the first in sheet
  // order is theirs (as getDriverJob says, lib/db/sheetJobs.js).
  const myKey = user?.driver?.key ?? null;
  let found = false;
  const driverJobs = jobs.map((job) => {
    const mine = !found && Boolean(myKey) && driverNameKey(job.driver ?? '') === myKey;
    if (mine) found = true;
    return toDriverSheetJob(job, { mine });
  });

  return (
    <PageContainer>
      <Typography variant='sectionHeading'>Jobs</Typography>
      <Paper variant='panel' sx={panelSx}>
        <JobsBoard jobs={driverJobs} stops={[...slicsByStop]} />
      </Paper>
    </PageContainer>
  );
}
