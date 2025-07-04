'use client';

import { Suspense } from 'react';

import { CircularProgress } from '@mui/material';

import EmptySlic from './EmptySlic';
import MapPhoneLinks from './MapPhoneLinks';
import PdfLink from './PdfLink';
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
        <PdfLink slic={slic} />
      </Suspense>
    </SlicDetailsContainer>
  );
}

export default SlicDisplay;
