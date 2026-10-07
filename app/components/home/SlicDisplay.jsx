'use client';

import { Suspense } from 'react';

import { CircularProgress } from '@mui/material';

import EmptySlic from './EmptySlic';
import SlicActions from './SlicActions';
import SlicDetailsContainer from './SlicDetailsContainer';
import TitleAddress from './TitleAddress';
import MemberDisplay from './MemberDisplay';

function SlicDisplay({ commentsCount, loading, slic, user }) {
  if (loading) {
    return (
      <SlicDetailsContainer>
        <CircularProgress aria-label='Loading SLIC' />
      </SlicDetailsContainer>
    );
  }

  if (!slic) {
    if (user?.bmcMember) {
      return <MemberDisplay user={user} />;
    } else {
      return <EmptySlic user={user} />;
    }
  }

  return (
    <SlicDetailsContainer>
      <Suspense fallback={<CircularProgress sx={{ mt: 2 }} />}>
        <TitleAddress slic={slic} />
        <SlicActions slic={slic} commentsCount={commentsCount} showTips />
      </Suspense>
    </SlicDetailsContainer>
  );
}

export default SlicDisplay;
