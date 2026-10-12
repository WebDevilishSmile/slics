import dayjs from 'dayjs';

import PageContainer from '@/components/layout/PageContainer';
import {
  getCoverBidJobsSince,
  serializeCoverBidJobs,
} from '@/lib/db/coverBidJobs';
import { getHiddenJobKeys } from '@/lib/db/coverBidJobHides';
import { isJobHidden } from '@/lib/coverBidJobRow';
import CoverBidJobsTable from '@/components/coverBidJobs/CoverBidJobsTable';
import { Typography } from '@mui/material';
import { getAdminSession } from '@/lib/authz';
import RedirectMessage from '@/components/layout/RedirectMessage';
import { getUpcomingSaturday } from '@/lib/format';
import { COVER_BID_MONTHS_BACK } from '@/constants';

// Admins only for now (decided 2026-10-10); the menu shows the link only to
// them. To open it to members, check `bmcMember || role === 'admin'` here and
// in header/UserMenu.jsx. The check comes before any read (docs/SECURITY.md #7).
export default async function CoverBidJobsPage() {
  if (!(await getAdminSession())) {
    return (
      <RedirectMessage
        heading='Cover Bids is admin-only for now.'
        subheading='Redirecting you to the home page…'
        redirect='/home'
      />
    );
  }

  // Snap the cutoff to a Saturday so the oldest week loads whole, and compute it
  // here so the server clock is the only one deciding the window.
  const cutoffWeek = getUpcomingSaturday(
    dayjs().subtract(COVER_BID_MONTHS_BACK, 'month'),
  ).format('YYYY-MM-DD');

  const [jobs, hiddenKeys] = await Promise.all([
    getCoverBidJobsSince(cutoffWeek),
    getHiddenJobKeys(cutoffWeek),
  ]);
  // Admins see every job, the ones hidden from drivers labeled
  // (docs/COVER-JOB-HIDING.md). /covers leaves them out instead.
  const serializedJobs = serializeCoverBidJobs(jobs).map((job) => ({
    ...job,
    hidden: isJobHidden(job, hiddenKeys),
  }));

  return (
    <PageContainer>
      <Typography variant='sectionHeading'>Cover Bids</Typography>
      <CoverBidJobsTable jobs={serializedJobs} minWeekEnding={cutoffWeek} />
    </PageContainer>
  );
}
