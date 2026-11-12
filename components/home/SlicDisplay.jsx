'use client';

import EmptySlic from './EmptySlic';
import EmptySlicSkeleton from './EmptySlicSkeleton';
import AddDirections from './AddDirections';
import ReportSlic from './ReportSlic';
import SlicActions from './SlicActions';
import SlicCardSkeleton from './SlicCardSkeleton';
import SlicDetailsContainer from './SlicDetailsContainer';
import TitleAddress from './TitleAddress';

// The lookup card, its skeleton while /home first mounts (#43), or the empty
// state when no SLIC is selected (#44, for members and non-members alike).
// The skeleton is the one the server sent (home/LookupSkeleton.jsx), the
// card's for a `?slic=` link (`expectsSlic`), so it doesn't change shape for
// the moment before the SLIC is found.
function SlicDisplay({ commentsCount, loading, expectsSlic, slic, user }) {
  if (loading) return expectsSlic ? <SlicCardSkeleton /> : <EmptySlicSkeleton />;
  if (!slic) return <EmptySlic user={user} />;

  return (
    <SlicDetailsContainer>
      <TitleAddress slic={slic} />
      <SlicActions slic={slic} commentsCount={commentsCount} showTips />
      {!slic.hasRoute && !slic.arrival && !slic.hasDocuments && <AddDirections key={`add-${slic.numSlic}`} slic={slic} />}
      <ReportSlic key={slic.numSlic} slic={slic} />
    </SlicDetailsContainer>
  );
}

export default SlicDisplay;
