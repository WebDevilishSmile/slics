'use client';

import { useState } from 'react';
import { WarehouseOutlined } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

import HomeBaseCard from '@/components/home/HomeBaseCard';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// Shows the "Which building do you work out of?" card (home/HomeBaseCard.jsx,
// docs/MULTI-HUB.md "Home base") in the super admin hub's Notes, as a driver
// SLICs can't place sees it on /home. Every button works, Another building
// and "My building isn't here" included, but it's a preview: nothing is saved
// and "Not now" snoozes nothing. Each Show starts it over.
export default function HomeBasePreview({ profileHref }) {
  const [shownAt, setShownAt] = useState(null);

  return (
    <Box component='section' aria-labelledby='home-base-preview'>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <WarehouseOutlined color='primary' />
        <Typography id='home-base-preview' variant='subtitle1' component='h4' sx={{ fontWeight: 700 }}>
          Home building card
        </Typography>
      </Box>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
        What a driver who hasn&apos;t said where they work out of finds on /home.
      </Typography>
      {shownAt ? (
        <HomeBaseCard key={shownAt} preview profileHref={profileHref} onHide={() => setShownAt(null)} />
      ) : (
        <Button
          onClick={() => setShownAt(Date.now())}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
        >
          Show it
        </Button>
      )}
    </Box>
  );
}
