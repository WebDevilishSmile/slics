'use client';

import { useSyncExternalStore } from 'react';

// How many Jobs-tab changes the signed-in admin hasn't seen
// (docs/ON-CALL-SHEET-SYNC.md, stage 3 alerts), shared between the header menu
// (header/UserMenu.jsx, which shows the badge and refetches on route changes
// through lib/adminAlertsStore.js) and /admin/jobs (sheetJobs/SheetJobsView.jsx, which clears it). The
// lib/tipsStore.js pattern: they render in different trees.
let count = 0;
const listeners = new Set();

// Bumped by every clear, so a count fetched before it lands is dropped instead
// of bringing back a badge the admin just cleared.
let version = 0;

function setCount(next) {
  if (next === count) return;
  count = next;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useJobChangesCount() {
  return useSyncExternalStore(subscribe, () => count, () => 0);
}

// For lib/adminAlertsStore.js, which fetches every admin count at once: call
// before the fetch, then pass it the count. A count fetched before a local
// clear or set lands is dropped. Failures keep the last count: a badge is a
// hint.
export function beginJobChangesRefresh() {
  const started = version;
  return (next) => {
    if (started === version) setCount(next);
  };
}

// /admin/jobs has shown every change up to `upTo` (the newest one's seenAt).
// Clears the badge at once, and again once the server has the mark, so a count
// fetched in between can't bring it back.
export async function markJobChangesSeen(upTo) {
  version += 1;
  setCount(0);
  try {
    await fetch('/api/sheet-jobs/seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upTo }),
    });
  } catch {
    // The banner and badge come back next time; nothing else depends on it.
  }
  version += 1;
}
