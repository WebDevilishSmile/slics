import { auth } from '@/auth';
import { serializeSlics } from '@/utils/functions';
import { getAllHubs } from '@/utils/slicsApi';
import { Button, Typography } from '@mui/material';
import Comments from '../components/comments/Comments';
import SlicDisplay from '../components/home/SlicDisplay';
import SlicsSearch from '../components/home/SlicsSearch';
import PageContainer from '../components/layout/PageContainer';

async function AllHubs() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }
  const user = session.user;
  const allHubs = await getAllHubs();

  return (
    <PageContainer>
      <Typography variant='h2' sx={{ textAlign: 'center', maxWidth: '40rem' }}>
        All Hubs
      </Typography>
      <Button variant='contained' href='/'>
        Home
      </Button>

      <SlicsSearch slics={serializeSlics(allHubs)} />

      <SlicDisplay slics={serializeSlics(allHubs)} />
      <Comments user={user} />
    </PageContainer>
  );
}

export default AllHubs;
