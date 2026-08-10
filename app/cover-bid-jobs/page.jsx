import PageContainer from '../components/layout/PageContainer';
import {
  getAllCoverBidJobs,
  serializeCoverBidJobs,
} from '@/utils/coverBidJobsApi';
import CoverBidJobsTable from '../components/coverBidJobs/CoverBidJobsTable';
import StyledHeading from '../components/layout/StyledHeading';

export default async function CoverBidJobsPage() {
  const jobs = await getAllCoverBidJobs();
  const serializedJobs = serializeCoverBidJobs(jobs);

  return (
    <PageContainer>
      <StyledHeading>Cover Bid Jobs</StyledHeading>
      <CoverBidJobsTable jobs={serializedJobs} />
    </PageContainer>
  );
}
