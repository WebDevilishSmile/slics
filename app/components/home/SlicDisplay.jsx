'use client';

import { Suspense } from 'react';

import { CircularProgress } from '@mui/material';

import EmptySlic from './EmptySlic';
import MapPhoneLinks from './MapPhoneLinks';
import PdfLink from './PdfLink';
import SlicDetailsContainer from './SlicDetailsContainer';
import TitleAddress from './TitleAddress';
import MoreDetailsLink from './MoreDetailsLink';

function SlicDisplay({ commentsCount, loading, slic, user }) {
  if (loading) {
    return (
      <SlicDetailsContainer title='Loading...'>
        <CircularProgress sx={{ mt: '1rem' }} />
      </SlicDetailsContainer>
    );
  }

  if (!slic) {
    return <EmptySlic user={user} />;
  }

  console.log('SlicDisplay user:', user);

  return (
    <SlicDetailsContainer>
      <Suspense fallback={<CircularProgress sx={{ mt: '1rem' }} />}>
        <TitleAddress slic={slic} commentsCount={commentsCount} />
        <MapPhoneLinks slic={slic} />
        <PdfLink slic={slic} />

        {/* Currently working on implementation of truck routing */}
        {/* {user.role === 'admin' && <MoreDetailsLink slic={slic} />} */}
      </Suspense>
    </SlicDetailsContainer>
  );
}

export default SlicDisplay;
