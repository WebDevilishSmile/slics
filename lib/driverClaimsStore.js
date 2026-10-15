'use client';

import { useSyncExternalStore } from 'react';

// How many driver verification claims are waiting (docs/COVER-BIDDING.md),
// shared between the header menu's badge (header/UserMenu.jsx, refetched on
// every route change) and the queue on /admin/driver-claims, which sets it as
// claims are decided. The lib/slicReportsStore.js pattern: a claim counts
// until an admin decides it.
let count = 0;
const listeners = new Set();

// Bumped by every local set, so a count fetched before it lands is dropped.
let version = 0;

function emit(next) {
  if (next === count) return;
  count = next;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function usePendingClaimsCount() {
  return useSyncExternalStore(subscribe, () => count, () => 0);
}

// For lib/adminAlertsStore.js, which fetches every admin count at once: call
// before the fetch, then pass it the count. A count fetched before a local
// clear or set lands is dropped. Failures keep the last count: a badge is a
// hint.
export function beginPendingClaimsRefresh() {
  const started = version;
  return (next) => {
    if (started === version) emit(next);
  };
}

// The queue knows the new count as soon as a claim is decided.
export function setPendingClaimsCount(next) {
  version += 1;
  emit(next);
}
