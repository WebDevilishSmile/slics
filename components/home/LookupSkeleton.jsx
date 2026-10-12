'use client';

import EmptySlicSkeleton from './EmptySlicSkeleton';
import SearchBarSkeleton from './SearchBarSkeleton';
import SlicCardSkeleton from './SlicCardSkeleton';

// What the server sends for the lookup screen's search and card, which only
// render in the browser (HydrationGuard in slic/SlicLookupPage.jsx): their
// skeletons, so Driver tips below doesn't show first and then get pushed
// down. A link to a SLIC (`?slic=`) gets the card's skeleton; otherwise
// it's the empty state's, recent lookups and all.
export default function LookupSkeleton({ hasSlic }) {
  return (
    <>
      <SearchBarSkeleton />
      {hasSlic ? <SlicCardSkeleton /> : <EmptySlicSkeleton />}
    </>
  );
}
