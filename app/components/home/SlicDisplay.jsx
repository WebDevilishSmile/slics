'use client';

import { useAppleDevice } from '@/utils/clientFunctions';
import { Apple, Google, PhoneOutlined } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import EmptySlic from './EmptySlic';

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
    <Paper
      sx={{
        width: '100%',
        maxWidth: '40rem',
        minHeight: '36rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: '2rem',
        py: '2rem',
        px: '1rem',
      }}
    >
      <Typography variant='h4' sx={{ textAlign: 'center', mb: '1rem' }}>
        Slic Details
      </Typography>

      <Typography variant='h6' sx={{ textAlign: 'center' }}>
        {slic?.numSlic} - {slic.type === 'center' ? slic.alphaSlic : slic.name}
      </Typography>

      <Box sx={{ textAlign: 'center', mt: '1.6rem' }}>
        <Typography>{slic.address.street}</Typography>
        <Typography>
          {slic.address.city}, {slic.address.state} {slic.address.zip}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: '1.6rem',
          gap: '1.6rem',
        }}
      >
        <Button
          variant='contained'
          href={`https://www.google.com/maps/search/?api=1&query=${slic.address.street},${slic.address.city},${slic.address.zip}`}
          target='_blank'
        >
          <Google />
          oogle Maps
        </Button>
        {isAppleDevice && (
          <Button
            variant='contained'
            href={`http://maps.apple.com/?q=${slic.address.street},${slic.address.city},${slic.address.zip}`}
            target='_blank'
            sx={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}
          >
            <Apple />
            Apple Maps
          </Button>
        )}
        {slic.type === 'center' && (
          <Button
            variant='contained'
            href={`tel:${slic.phone}`}
            target='_blank'
            sx={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}
          >
            <PhoneOutlined /> {slic.alphaSlic} Dispatch
          </Button>
        )}
      </Box>
    </Paper>
  );
}

export default SlicDisplay;
