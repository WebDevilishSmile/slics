import theme from '@/utils/theme';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Typography } from '@mui/material';

import { getCommentsBySlic } from '@/utils/commentsApi';
import { serializeSlics } from '@/utils/functions';
import { getAllHubs } from '@/utils/slicsApi';

import Comments from '../components/comments/Comments';
import Main from '../components/home/Main';
import HomeButton from '../components/layout/HomeButton';
import PageContainer from '../components/layout/PageContainer';

async function AllHubs({ searchParams }) {
  const session = await auth();

  if (!session) {
    redirect('/');
  }
  const user = session.user;
  const allHubs = await getAllHubs();

  const searchParameters = await searchParams;
  const slic = searchParameters.slic ? searchParameters.slic : null;

  let comments = [];
  let commentsCount = 0; // Default to 0 if no slic is selected

  if (slic) {
    comments = await getCommentsBySlic(slic);
    commentsCount = comments.length;
  }

  return (
    <PageContainer>
      <HomeButton />

      <Typography variant='h2' sx={{ textAlign: 'center', maxWidth: theme.layout.width.prose }}>
        All Hubs
      </Typography>

      <Main
        slics={serializeSlics(allHubs)}
        commentsCount={commentsCount}
        user={user}
      />

      <Comments user={user} comments={comments} />
    </PageContainer>
  );
}

export default AllHubs;
