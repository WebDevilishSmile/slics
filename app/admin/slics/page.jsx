import { serializeSlics } from '@/utils/functions';
import { getAllSlics } from '@/utils/slicsApi';
import { Typography } from '@mui/material';

import SlicsTable from '../../components/admin/SlicsTable';
import PageContainer from '../../components/layout/PageContainer';
import BackButton from '@/app/components/layout/BackButton';

async function SlicsTablePage() {
  const slics = await getAllSlics();

  return (
    <PageContainer>
      <BackButton />
      <Typography variant='h2'>Slics</Typography>

      <SlicsTable slics={serializeSlics(slics)} />
    </PageContainer>
  );
}

export default SlicsTablePage;
