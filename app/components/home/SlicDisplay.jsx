'use client';

import { useAppleDevice } from '@/utils/clientFunctions';
import { Box, CircularProgress } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import EmptySlic from './EmptySlic';
import SlicDetailsContainer from './SlicDetailsContainer';
import TitleAddress from './TitleAddress';
import MapPhoneLinks from './MapPhoneLinks';

function SlicDisplay({ slics }) {
  const [slic, setSlic] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state

  const searchParams = useSearchParams();
  const isAppleDevice = useAppleDevice();

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
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100%'
      >
        <CircularProgress />
      </Box>
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
