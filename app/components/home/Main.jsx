'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { serializeSlics } from '@/utils/functions';
import { Button, Typography } from '@mui/material';

import SlicDisplay from './SlicDisplay';
import SlicsSearch from './SlicsSearch';

function Main({ slics, commentsCount }) {
  const [loading, setLoading] = useState(true);
  const [slic, setSlic] = useState(null);

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

  return (
    <>
      <SlicsSearch
        slics={serializeSlics(slics)}
        setLoading={setLoading}
        loading={loading}
      />

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
        slic={slic}
        setSlic={setSlic}
      />
    </>
  );
}

export default Main;
