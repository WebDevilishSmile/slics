'use client';

import { useAppleDevice } from '@/utils/clientFunctions';
import { Apple, Google, PhoneOutlined } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import EmptySlic from './EmptySlic';
import SlicDetailsContainer from './SlicDetailsContainer';
import TitleAddress from './TitleAddress';
import MapPhoneLinks from './MapPhoneLinks';

function SlicDisplay({ slics }) {
  const [slic, setSlic] = useState(null);

  const searchParams = useSearchParams();
  const isAppleDevice = useAppleDevice();

  useEffect(() => {
    const numSlic = searchParams.get('slic');

    if (numSlic) {
      const foundSlic = slics.find(
        (s) => s.numSlic.toString() === numSlic.toString()
      );
      setSlic(foundSlic);
    } else {
      setSlic(null);
      return;
    }
  }, [searchParams, slics]);

  // const centers =

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
