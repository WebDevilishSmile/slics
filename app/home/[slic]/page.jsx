import { getSession } from '@/lib/authz';
import PageContainer from '@/components/layout/PageContainer';
import RedirectMessage from '@/components/layout/RedirectMessage';
import Title from '@/components/slic/Title';

import { getSlicByNumSlic } from '@/lib/db/slics';
import { getCommentsBySlic } from '@/lib/db/comments';
import { getRoute } from '@/lib/db/slicRoutes';
import { toDriverSlic } from '@/lib/serializers';

export default async function SlicPage({ params }) {
  const { slic } = await params;
  const session = await getSession();

  if (!session) {
    return (
      <RedirectMessage
        heading='You must be logged in to view SLICs.'
        redirect='/sign-in'
      />
    );
  }
  const user = session.user;
  const [slicData, route] = await Promise.all([
    getSlicByNumSlic(slic),
    getRoute(slic).catch(() => null),
  ]);

  let comments = [];
  let commentsCount = 0;

  if (slic) {
    comments = await getCommentsBySlic(slic);
    commentsCount = comments.length;
  }

  return (
    <PageContainer>
      <Title slic={toDriverSlic(slicData, { hasRoute: Boolean(route) })} commentsCount={commentsCount} />
    </PageContainer>
  );
}
