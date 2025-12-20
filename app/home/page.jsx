import { auth } from '@/auth';
import { getCommentsBySlic } from '@/utils/commentsApi';
import { serializeSlics } from '@/utils/functions';
import { getAllSlics } from '@/utils/slicsApi';
import { Typography } from '@mui/material';

import Comments from '../components/comments/Comments';
import Main from '../components/home/Main';
import BackButton from '../components/layout/BackButton';
import PageContainer from '../components/layout/PageContainer';
import RedirectMessage from '../components/layout/RedirectMessage';
import HydrationGuard from '../components/utility/HydrationGuard';

export default async function Home({ searchParams }) {
  const session = await auth();

  if (!session) {
    return (
      <RedirectMessage
        heading='You must be logged in to view SLICs.'
        redirect='/'
      />
    );
  }
  const searchParameters = await searchParams;
  const slic = searchParameters.slic ? searchParameters.slic : null;

  const user = session.user;
  const slics = await getAllSlics();

  let comments = [];
  let commentsCount = 0;

  if (slic) {
    comments = await getCommentsBySlic(slic);
    commentsCount = comments.length;
  }

  return (
    <PageContainer>
      <BackButton />
      <Typography variant='h1'>SLICs</Typography>

      <HydrationGuard>
        <Main slics={serializeSlics(slics)} commentsCount={commentsCount} />
      </HydrationGuard>

      <Comments user={user} />
    </PageContainer>
  );
}
