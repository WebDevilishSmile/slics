import PageContainer from '../components/layout/PageContainer';
import { getAllBidJobs } from '@/lib/db/bidJobs';
import { serializeBidJobs } from '@/lib/serializers';
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
