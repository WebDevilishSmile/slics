import { auth } from '@/auth';
import { Typography } from '@mui/material';

import { getCommentsBySlic } from '@/lib/db/comments';
import { serializeSlics } from '@/lib/serializers';
import { getAllSlics } from '@/lib/db/slics';

import CommentPrompt from '@/components/comments/CommentPrompt';
import Comments from '@/components/comments/Comments';
import Main from '@/components/home/Main';
import InstallNudge from '@/components/install/InstallNudge';
import PageContainer from '@/components/layout/PageContainer';
import RedirectMessage from '@/components/layout/RedirectMessage';
import HydrationGuard from '@/components/utility/HydrationGuard';

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
      <Typography variant='h1'>SLICs</Typography>
      <InstallNudge />
      <CommentPrompt user={user} />

      <HydrationGuard>
        <Main
          slics={serializeSlics(slics)}
          commentsCount={commentsCount}
          user={user}
        />
      </HydrationGuard>

      <Comments user={user} />
    </PageContainer>
  );
}
