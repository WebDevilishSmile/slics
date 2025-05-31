import { auth } from '@/auth';
import { getAllSlics } from '@/utils/slicsApi';
import { Button, Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import { serializeSlics } from '@/utils/functions';
import Comments from '../components/comments/Comments';
import SlicDisplay from '../components/home/SlicDisplay';
import SlicsSearch from '../components/home/SlicsSearch';
import PageContainer from '../components/layout/PageContainer';
import { getCommentsBySlic } from '@/utils/commentsApi';

export default async function Home({ searchParams }) {
  const session = await auth();
  const searchParameters = await searchParams;
  const slic = searchParameters.slic ? searchParameters.slic : null;
  if (!session) {
    redirect('/signin');
  }
  const user = session.user;
  const slics = await getAllSlics();
  // const comments = await getAllComments();
  let comments = [];
  let commentsCount = 0;

  if (slic) {
    // If a specific SLIC is requested, fetch comments for that SLIC
    comments = await getCommentsBySlic(slic);
    commentsCount = comments.length;
  }

  return (
    <PageContainer>
      <Typography variant='h1'>SLICs</Typography>
      <Button variant='contained' href='/all'>
        All Hubs
      </Button>

      <SlicsSearch slics={serializeSlics(slics)} />

      <SlicDisplay
        slics={serializeSlics(slics)}
        commentsCount={commentsCount}
      />

      <Comments user={user} />
    </PageContainer>
  );
}
