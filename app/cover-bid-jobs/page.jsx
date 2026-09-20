import dayjs from 'dayjs';

import PageContainer from '../components/layout/PageContainer';
import {
  getCoverBidJobsSince,
  serializeCoverBidJobs,
} from '@/utils/coverBidJobsApi';
import CoverBidJobsTable from '../components/coverBidJobs/CoverBidJobsTable';
import { Typography } from '@mui/material';
import { auth } from '@/auth';
import NotMember from '../components/coverBidJobs/NotMember';
import { getUpcomingSaturday } from '@/utils/functions';
import { COVER_BID_MONTHS_BACK } from '@/utils/variables';

export default async function CoverBidJobsPage() {
  // Snap the cutoff to a Saturday so the oldest week loads whole, and compute it
  // here so the server clock is the only one deciding the window.
  const cutoffWeek = getUpcomingSaturday(
    dayjs().subtract(COVER_BID_MONTHS_BACK, 'month'),
  ).format('YYYY-MM-DD');

  const jobs = await getCoverBidJobsSince(cutoffWeek);
  const serializedJobs = serializeCoverBidJobs(jobs);

  // Check if user is a BMC member
  const session = await auth();
  const user = session?.user;

  if (!user || !user.bmcMember || user.role !== 'admin') {
    return (
      <PageContainer>
        <NotMember />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Typography variant='sectionHeading'>Cover Bid Jobs</Typography>
      <CoverBidJobsTable jobs={serializedJobs} minWeekEnding={cutoffWeek} />
    </PageContainer>
  );
}
