import { auth } from '@/auth';
import { getAllSlics } from '@/utils/slicsApi';
import { Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import { serializeSlics } from '@/utils/functions';
import SlicsSearch from './components/home/SlicsSearch';
import PageContainer from './components/layout/PageContainer';
import BackButton from './components/layout/BackButton';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  const slics = await getAllSlics();
  return (
    <PageContainer>
      <BackButton />
      <Typography variant='h1'>SLICs</Typography>

      <SlicsSearch slics={serializeSlics(slics)} />
    </PageContainer>
  );
}
