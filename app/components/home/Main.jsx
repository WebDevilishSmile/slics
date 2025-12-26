'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { serializeSlics } from '@/utils/functions';

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
