'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Admins: every verified driver's cover list for a week, and the demand for
 * each job (docs/COVER-BIDDING.md, stage 2; GET /api/cover-preferences).
 * `demandByKey` is a Map of jobKey → { lists, first } for the job grids.
 * Bump `refreshKey` to refetch.
 */
export function useCoverLists({ weekEndDate, refreshKey }) {
  const [state, setState] = useState({ lists: [], demand: [], loading: true, error: null });
  const weekEnding = weekEndDate ? weekEndDate.format('YYYY-MM-DD') : null;

  useEffect(() => {
    if (!weekEnding) return;
    let cancelled = false;

    async function fetchLists() {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const res = await fetch(`/api/cover-preferences?week=${weekEnding}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Couldn't load the drivers' lists.");
        if (!cancelled) setState({ ...data.data, loading: false, error: null });
      } catch (err) {
        if (!cancelled) setState({ lists: [], demand: [], loading: false, error: err.message });
      }
    }

    fetchLists();
    return () => {
      cancelled = true;
    };
  }, [weekEnding, refreshKey]);

  const demandByKey = useMemo(
    () => new Map(state.demand.map(({ jobKey, lists, first }) => [jobKey, { lists, first }])),
    [state.demand],
  );

  return { ...state, demandByKey };
}
