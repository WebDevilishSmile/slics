import { auth } from '@/auth';
import { getCommentsBySlic } from '@/utils/commentsApi';
import { serializeSlics } from '@/utils/functions';
import { getAllHubs } from '@/utils/slicsApi';
import { Button, Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import Comments from '../components/comments/Comments';
import SlicDisplay from '../components/home/SlicDisplay';
import SlicsSearch from '../components/home/SlicsSearch';
import PageContainer from '../components/layout/PageContainer';
import Main from '../components/home/Main';

async function AllHubs({ searchParams }) {
  const session = await auth();
  const searchParameters = await searchParams;
  const slic = searchParameters.slic ? searchParameters.slic : null;

  if (!session) {
    redirect('/');
  }
  const user = session.user;
  const allHubs = await getAllHubs();

  let comments = [];
  let commentsCount = 0; // Default to 0 if no slic is selected

  if (slic) {
    comments = await getCommentsBySlic(slic);
    commentsCount = comments.length;
  }

  return (
    <PageContainer>
      <Typography variant='h2' sx={{ textAlign: 'center', maxWidth: '40rem' }}>
        All Hubs
      </Typography>
      <Button variant='contained' href='/home'>
        Home
      </Button>

      <Main slics={serializeSlics(allHubs)} commentsCount={commentsCount} />

      <Comments user={user} />
    </PageContainer>
  );
}

export default AllHubs;
