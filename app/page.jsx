import { auth } from '@/auth';
import { getAllSlics } from '@/utils/slicsApi';
import { Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import PageContainer from './components/layout/PageContainer';
import DataManipulation from './components/home/DataManipulation';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  const slics = await getAllSlics();

  return (
    <PageContainer>
      <Typography variant='h1'>SLICs</Typography>
    </PageContainer>
  );
}
