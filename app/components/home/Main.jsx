'use client';

import { serializeSlics } from '@/utils/functions';
import { Button, Typography } from '@mui/material';

import SlicDisplay from './SlicDisplay';
import SlicsSearch from './SlicsSearch';
import { useState } from 'react';

function Main({ slics, commentsCount }) {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <SlicsSearch slics={serializeSlics(slics)} setLoading={setLoading} />

      <Typography sx={{ mt: '1rem' }} variant='caption'>
        Click All Hubs to view a list of all UPS hubs.
      </Typography>
      <Button variant='contained' href='/all'>
        All Hubs
      </Button>

      <SlicDisplay
        slics={serializeSlics(slics)}
        commentsCount={commentsCount}
        loading={loading}
        setLoading={setLoading}
      />
    </>
  );
}

export default Main;
