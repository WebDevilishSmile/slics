'use client';

import { Suspense, useEffect, useState } from 'react';

import { CircularProgress } from '@mui/material';
import { useSearchParams } from 'next/navigation';

import EmptySlic from './EmptySlic';
import MapPhoneLinks from './MapPhoneLinks';
import SlicDetailsContainer from './SlicDetailsContainer';
import TitleAddress from './TitleAddress';

function SlicDisplay({ commentsCount, loading, slic }) {
  if (loading) {
    return (
      <SlicDetailsContainer title='Loading...'>
        <CircularProgress sx={{ mt: '1rem' }} />
      </SlicDetailsContainer>
    );
  }

  if (!slic) {
    return <EmptySlic />;
  }

  return (
    <SlicDetailsContainer>
      <Suspense fallback={<CircularProgress sx={{ mt: '1rem' }} />}>
        <TitleAddress slic={slic} commentsCount={commentsCount} />
        <MapPhoneLinks slic={slic} />
      </Suspense>
    </SlicDetailsContainer>
  );
}

export default SlicDisplay;
