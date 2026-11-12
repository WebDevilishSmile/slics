import { getCommentsBySlic } from '@/lib/db/comments';
import { countSlicViews } from '@/lib/db/slicViews';
import { getRouteNumSlics } from '@/lib/db/slicRoutes';
import { getDocumentNumSlics } from '@/lib/db/slicDocuments';
import { toDriverSlics } from '@/lib/serializers';

import Comments from '@/components/comments/Comments';
import LookupSkeleton from '@/components/home/LookupSkeleton';
import Main from '@/components/home/Main';
import PageContainer from '@/components/layout/PageContainer';
import HydrationGuard from '@/components/utility/HydrationGuard';

// The SLIC lookup screen, shared by /home (every SLIC) and /hubs (the UPS hubs
// only): the search, the looked-up SLIC's card (`?slic=`) and its Driver tips.
// The routes check the session and load `slics`; they differ only in the
// list, the `heading`, and what they put under it (`children`).

// Which SLICs have directions as text (docs/SLIC-DIRECTIONS.md), so the card
// shows Directions without a call per lookup. Without them the card shows
// the PDF, so a failure here never breaks the lookup screen.
async function routeNumSlics() {
  try {
    return await getRouteNumSlics();
  } catch (error) {
    console.error('Error listing routes for the lookup page:', error);
    return new Set();
  }
}

// Which SLICs have photos or PDFs (docs/SLIC-DIRECTIONS.md, stage 3). Same
// rule: without them the card just doesn't offer them.
async function documentNumSlics() {
  try {
    return await getDocumentNumSlics();
  } catch (error) {
    console.error('Error listing documents for the lookup page:', error);
    return new Set();
  }
}

// The driver's lifetime lookup count, read with the page instead of by a call
// of its own. A counter is never worth failing the lookup screen over.
async function lookupCount(userId) {
  try {
    return await countSlicViews(userId);
  } catch (error) {
    console.error('Error counting lookups for the lookup page:', error);
    return 0;
  }
}

export default async function SlicLookupPage({
  searchParams,
  slics,
  user,
  heading,
  children,
}) {
  const { slic } = await searchParams;
  const [commentsCount, viewCount, withRoutes, withDocuments] = await Promise.all([
    slic ? getCommentsBySlic(slic).then((comments) => comments.length) : 0,
    lookupCount(user.id),
    routeNumSlics(),
    documentNumSlics(),
  ]);

  return (
    <PageContainer>
      {heading}
      {children}

      <HydrationGuard fallback={<LookupSkeleton hasSlic={Boolean(slic)} />}>
        <Main
          slics={toDriverSlics(slics, withRoutes, withDocuments)}
          commentsCount={commentsCount}
          viewCount={viewCount}
          user={user}
        />
      </HydrationGuard>

      <Comments user={user} />
    </PageContainer>
  );
}
