'use client';

import { useSyncExternalStore } from 'react';

// How many drivers' route suggestions are open (docs/SLIC-DIRECTIONS.md,
// stage 2), shared between the header menu's badge (header/UserMenu.jsx) and
// the queue on /admin/routes, which sets it as suggestions are decided. The
// lib/slicReportsStore.js pattern: one counts until an admin decides it.
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

export function useOpenRouteSuggestionsCount() {
  return useSyncExternalStore(subscribe, () => count, () => 0);
}

// For lib/adminAlertsStore.js: call before the fetch, then pass it the count.
export function beginOpenRouteSuggestionsRefresh() {
  const started = version;
  return (next) => {
    if (started === version) emit(next);
  };
}

// The queue knows the new count as soon as one is decided.
export function setOpenRouteSuggestionsCount(next) {
  version += 1;
  emit(next);
}
