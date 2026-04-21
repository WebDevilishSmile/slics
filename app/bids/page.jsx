import PageContainer from '../components/layout/PageContainer';
import { getAllBidJobs, serializeBidJobs } from '@/utils/bidFunctions';
import BidsTable from '../components/bids/BidsTable';

export default async function BidsPage() {
  const bidJobs = await getAllBidJobs();
  const serializedJobs = serializeBidJobs(bidJobs);

  return (
    <PageContainer>
      <BidsTable jobs={serializedJobs} />
    </PageContainer>
  );
}
