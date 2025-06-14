import { auth } from '@/auth';
import { getCommentsBySlic } from '@/utils/commentsApi';
import { serializeSlics } from '@/utils/functions';
import { getAllSlics } from '@/utils/slicsApi';
import { Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import Comments from '../components/comments/Comments';
import Main from '../components/home/Main';
import BackButton from '../components/layout/BackButton';
import PageContainer from '../components/layout/PageContainer';
import { Suspense } from 'react';

export default async function Home({ searchParams }) {
  const session = await auth();
  const searchParameters = await searchParams;
  const slic = searchParameters.slic ? searchParameters.slic : null;
  if (!session) {
    redirect('/signin');
  }
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
      {/* <SupportBanner /> */}
      <BackButton />
      <Typography variant='h1'>SLICs</Typography>

      <Main slics={serializeSlics(slics)} commentsCount={commentsCount} />

      <Comments user={user} />
    </PageContainer>
  );
}
