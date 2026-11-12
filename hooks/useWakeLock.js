'use client';

import { useEffect } from 'react';

// Keeps the screen on while `active` (the directions sheet, docs/SLIC-
// DIRECTIONS.md), through the Screen Wake Lock API (Safari 16.4+, Chrome).
// A browser drops the lock whenever the page is hidden, so it's asked for
// again each time the page comes back. Where the API is missing or refused
// (low battery, an old browser), the screen just sleeps as usual.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return undefined;
    }
    let lock = null;
    let stopped = false;

    const acquire = async () => {
      try {
        const next = await navigator.wakeLock.request('screen');
        if (stopped) next.release().catch(() => {});
        else lock = next;
      } catch {
        // Refused: nothing to do.
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && (!lock || lock.released)) acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
