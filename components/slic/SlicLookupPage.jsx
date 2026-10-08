import { getCommentsBySlic } from '@/lib/db/comments';
import { serializeSlics } from '@/lib/serializers';

import Comments from '@/components/comments/Comments';
import Main from '@/components/home/Main';
import PageContainer from '@/components/layout/PageContainer';
import HydrationGuard from '@/components/utility/HydrationGuard';

// The SLIC lookup screen, shared by /home (every SLIC) and /hubs (the UPS hubs
// only): the search, the looked-up SLIC's card (`?slic=`) and its Driver tips.
// The routes check the session and load `slics`; they differ only in the
// list, the `heading`, and what they put under it (`children`).
export default async function SlicLookupPage({
  searchParams,
  slics,
  user,
  heading,
  children,
}) {
  const { slic } = await searchParams;
  const commentsCount = slic ? (await getCommentsBySlic(slic)).length : 0;

  return (
    <PageContainer>
      {heading}
      {children}

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
