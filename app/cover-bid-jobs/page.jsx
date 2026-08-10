import PageContainer from '../components/layout/PageContainer';
import {
  getAllCoverBidJobs,
  serializeCoverBidJobs,
} from '@/utils/coverBidJobsApi';
import CoverBidJobsTable from '../components/coverBidJobs/CoverBidJobsTable';
import StyledHeading from '../components/layout/StyledHeading';
import { auth } from '@/auth';
import NotMember from '../components/coverBidJobs/NotMember';

export default async function CoverBidJobsPage() {
  const jobs = await getAllCoverBidJobs();
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
      <StyledHeading>Cover Bid Jobs</StyledHeading>
      <CoverBidJobsTable jobs={serializedJobs} />
    </PageContainer>
  );
}
