'use client';

import EmptySlic from './EmptySlic';
import SlicActions from './SlicActions';
import SlicCardSkeleton from './SlicCardSkeleton';
import SlicDetailsContainer from './SlicDetailsContainer';
import TitleAddress from './TitleAddress';

// The lookup card, its skeleton while /home first mounts (#43), or the empty
// state when no SLIC is selected (#44, for members and non-members alike).
function SlicDisplay({ commentsCount, loading, slic, user }) {
  if (loading) return <SlicCardSkeleton />;
  if (!slic) return <EmptySlic user={user} />;

  return (
    <SlicDetailsContainer>
      <TitleAddress slic={slic} />
      <SlicActions slic={slic} commentsCount={commentsCount} showTips />
    </SlicDetailsContainer>
  );
}

export default SlicDisplay;
