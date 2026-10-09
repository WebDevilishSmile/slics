'use client';

import { useEffect, useState } from 'react';

/**
 * A week's saved picks from the on-call sheet, and their recent changes
 * (docs/ON-CALL-SHEET-SYNC.md). Reads what's saved; only the Refresh button
 * reads the sheet. Bump `refreshKey` to refetch.
 */
export function useCoverBidPicks({ weekEndDate, refreshKey }) {
  const [state, setState] = useState({ picks: null, events: [], loading: true, error: null });
  const weekEnding = weekEndDate ? weekEndDate.format('YYYY-MM-DD') : null;

  useEffect(() => {
    if (!weekEnding) return;
    let cancelled = false;

    async function fetchPicks() {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const res = await fetch(`/api/cover-bid-jobs/picks?weekEnding=${weekEnding}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Couldn't load the picks.");
        if (!cancelled) {
          setState({ ...data.data, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ picks: null, events: [], loading: false, error: err.message });
        }
      }
    }

    fetchPicks();
    return () => {
      cancelled = true;
    };
  }, [weekEnding, refreshKey]);

  return state;
}
