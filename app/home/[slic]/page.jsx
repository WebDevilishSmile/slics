import { auth } from '@/auth';
import PageContainer from '../../components/layout/PageContainer';
import RedirectMessage from '../../components/layout/RedirectMessage';
import Title from '../../components/slicPage/Title';

import { getSlicByNumSlic } from '@/utils/slicsApi';
import { getCommentsBySlic } from '@/utils/commentsApi';
import { serializeSlic } from '@/utils/functions';
import CommentsPage from '@/app/components/slicPage/CommentsPage';

export default async function SlicPage({ params }) {
  const { slic } = await params;
  const session = await auth();

  if (!session) {
    return (
      <RedirectMessage
        heading='You must be logged in to view SLICs.'
        redirect='/'
      />
    );
  }
  const user = session.user;
  const slicData = await getSlicByNumSlic(slic);

  let comments = [];
  let commentsCount = 0;

  if (slic) {
    comments = await getCommentsBySlic(slic);
    commentsCount = comments.length;
  }

  return (
    <PageContainer>
      <Title slic={serializeSlic(slicData)} commentsCount={commentsCount} />
    </PageContainer>
  );
}
