import { auth } from '@/auth';
import { getAllSlics } from '@/utils/slicsApi';
import { Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import { serializeSlics } from '@/utils/functions';
import SlicsSearch from './components/home/SlicsSearch';
import PageContainer from './components/layout/PageContainer';
import SlicDisplay from './components/home/SlicDisplay';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  const slics = await getAllSlics();
  return (
    <PageContainer>
      <Typography variant='h1'>SLICs</Typography>

      <SlicsSearch slics={serializeSlics(slics)} />

      <SlicDisplay slics={serializeSlics(slics)} />
    </PageContainer>
  );
}
