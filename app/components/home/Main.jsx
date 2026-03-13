'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { serializeSlics } from '@/utils/functions';

import SlicDisplay from './SlicDisplay';
import SlicsSearch from './SlicsSearch';

function Main({ slics, commentsCount }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [slic, setSlic] = useState(null);
  const [viewCount, setViewCount] = useState(0);
  const prevSlicNumRef = useRef(null);

  const searchParams = useSearchParams();

  // Fetch lifetime view count on mount
  useEffect(() => {
    fetch('/api/user/views')
      .then((r) => r.json())
      .then((data) => {
        if (data.slicViews !== undefined) setViewCount(data.slicViews);
      })
      .catch(() => {});
  }, []);

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

  // Track each unique slic view
  useEffect(() => {
    if (slic && slic.numSlic !== prevSlicNumRef.current) {
      prevSlicNumRef.current = slic.numSlic;
      fetch('/api/user/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numSlic: slic.numSlic }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.slicViews !== undefined) setViewCount(data.slicViews);
        })
        .catch(() => {});
    } else if (!slic) {
      prevSlicNumRef.current = null;
    }
  }, [slic]);

  return (
    <>
      <SlicsSearch
        slics={serializeSlics(slics)}
        setLoading={setLoading}
        loading={loading}
        viewCount={viewCount}
        isMember={!!session?.user?.bmcMember}
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
