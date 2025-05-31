import { auth } from '@/auth';
import { getAllSlics } from '@/utils/slicsApi';
import { Button, Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import { serializeSlics } from '@/utils/functions';
import Comments from './components/comments/Comments';
import SlicDisplay from './components/home/SlicDisplay';
import SlicsSearch from './components/home/SlicsSearch';
import PageContainer from './components/layout/PageContainer';
import { allHubs } from '@/utils/allHubs';
import DataManipulation from './components/home/DataManipulation';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }
  const user = session.user;
  const slics = await getAllSlics();

  return (
    <PageContainer>
      <Typography variant='h1'>SLICs</Typography>
      <Button variant='contained' href='/all'>
        All Hubs
      </Button>

      <SlicsSearch slics={serializeSlics(slics)} />

      <SlicDisplay slics={serializeSlics(slics)} />

      <Comments user={user} />
    </PageContainer>
  );
}
