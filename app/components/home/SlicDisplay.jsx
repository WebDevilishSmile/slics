'use client';

import { useEffect, useState } from 'react';

import { CircularProgress } from '@mui/material';
import { useSearchParams } from 'next/navigation';

import EmptySlic from './EmptySlic';
import MapPhoneLinks from './MapPhoneLinks';
import SlicDetailsContainer from './SlicDetailsContainer';
import TitleAddress from './TitleAddress';

function SlicDisplay({ slics }) {
  const [slic, setSlic] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state

  const searchParams = useSearchParams();

  useEffect(() => {
    const numSlic = searchParams.get('slic');

    if (numSlic) {
      const foundSlic = slics.find(
        (s) => s.numSlic.toString() === numSlic.toString()
      );
      setSlic(foundSlic || null);
    } else {
      setSlic(null);
    }

    setLoading(false); // End loading once processing is done
  }, [searchParams, slics]);

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
      <TitleAddress slic={slic} />
      <MapPhoneLinks slic={slic} />
    </SlicDetailsContainer>
  );
}

export default SlicDisplay;
