'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { recordLookup } from '@/lib/commentPrompt';
import { recordRecentLookup } from '@/lib/recentLookups';
import { serializeSlics } from '@/lib/serializers';
import { withViewTransition } from '@/lib/viewTransition';

import SlicDisplay from './SlicDisplay';
import SlicsSearch from './SlicsSearch';

function Main({ slics, commentsCount, user }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [slic, setSlic] = useState(null);
  const [viewCount, setViewCount] = useState(0);
  const prevSlicNumRef = useRef(null);

  const searchParams = useSearchParams();

  // Fetch lifetime view count on mount
  useEffect(() => {
    fetch('/api/users/me/views')
      .then((r) => r.json())
      .then((data) => {
        if (data.slicViews !== undefined) setViewCount(data.slicViews);
      })
      // Best-effort stat: a failed counter must not disturb the lookup itself.
      .catch((err) => console.error('Error fetching view count:', err));
  }, []);

  const findSlic = useCallback(
    (numSlic) =>
      numSlic
        ? (slics.find((s) => s.numSlic.toString() === String(numSlic)) ?? null)
        : null,
    [slics],
  );

  // Every change of the SLIC on screen goes through here. A real change
  // cross-fades the lookup card (UI-SUGGESTIONS.md #48). The first render after
  // the skeleton, and a "change" to the SLIC already shown, apply instantly.
  // Compared by number: a navigation re-renders with a fresh `slics` array, so
  // the same SLIC can arrive as a new object.
  const current = useRef({ slic: null, loading: true });
  useEffect(() => {
    current.current = { slic, loading };
  }, [slic, loading]);
  const changeSlic = useCallback((next) => {
    const { slic: shown, loading: first } = current.current;
    const apply = () => {
      setSlic(next);
      setLoading(false);
    };
    if (first || next?.numSlic === shown?.numSlic) apply();
    else withViewTransition(apply);
  }, []);

  // The URL is the source of truth: a recent chip, Back/Forward, a shared link.
  useEffect(() => {
    changeSlic(findSlic(searchParams.get('slic')));
  }, [searchParams, findSlic, changeSlic]);

  // A pick in the search shows its SLIC at once from the in-memory list
  // (UI-SUGGESTIONS.md #43): the details need no fetch, so there's nothing to
  // wait for. The URL catches up through the search's router.push, and the
  // effect above then lands on the same SLIC, a no-op.
  const showSlic = useCallback(
    (numSlic) => changeSlic(findSlic(numSlic)),
    [changeSlic, findSlic],
  );

  // The server's comment count is for the SLIC in the URL; until the URL
  // catches up with a new pick it belongs to the previous SLIC, so hold it back.
  const urlSlic = searchParams.get('slic');
  const countForSlic =
    slic && String(slic.numSlic) === urlSlic ? commentsCount : undefined;

  // Track each unique slic view
  useEffect(() => {
    if (slic && slic.numSlic !== prevSlicNumRef.current) {
      prevSlicNumRef.current = slic.numSlic;
      recordLookup(slic);
      recordRecentLookup(slic);
      fetch('/api/users/me/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numSlic: slic.numSlic }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.slicViews !== undefined) setViewCount(data.slicViews);
        })
        .catch((err) => console.error('Error tracking slic view:', err));
    } else if (!slic) {
      prevSlicNumRef.current = null;
    }
  }, [slic]);

  return (
    <>
      <SlicsSearch
        slics={serializeSlics(slics)}
        onSelect={showSlic}
        viewCount={viewCount}
        isMember={!!session?.user?.bmcMember}
      />

      <SlicDisplay
        commentsCount={countForSlic}
        loading={loading}
        slic={slic}
        user={user}
      />
    </>
  );
}

export default Main;
