'use client';

import { useSyncExternalStore } from 'react';

// How many cover reports are open (lib/db/coverReports.js), shared between the
// header menu's badge (header/UserMenu.jsx, refetched on every route change)
// and the queue on /admin/cover/reports, which sets it as reports close. The
// lib/jobChangesStore.js pattern. Unlike job changes it isn't "since you last
// looked": a report counts until an admin resolves or dismisses it.
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

export function useOpenCoverReportsCount() {
  return useSyncExternalStore(subscribe, () => count, () => 0);
}

// For lib/adminAlertsStore.js, which fetches every admin count at once: call
// before the fetch, then pass it the count. A count fetched before a local
// clear or set lands is dropped. Failures keep the last count: a badge is a
// hint.
export function beginOpenCoverReportsRefresh() {
  const started = version;
  return (next) => {
    if (started === version) emit(next);
  };
}

// The queue knows the new count as soon as a report closes or reopens.
export function setOpenCoverReportsCount(next) {
  version += 1;
  emit(next);
}
