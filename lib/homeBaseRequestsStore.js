'use client';

import { useSyncExternalStore } from 'react';

// How many home building changes verified drivers or staff asked for and an
// admin hasn't decided (docs/MULTI-HUB.md "Home base", step 4), shared between
// the header menu's badge (header/UserMenu.jsx) and the admin user page
// (admin/users/UserHomeBase.jsx), which lowers it as one is decided. The
// lib/driverClaimsStore.js pattern: a request counts until it's decided.
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

export function useHomeBaseRequestsCount() {
  return useSyncExternalStore(subscribe, () => count, () => 0);
}

// For lib/adminAlertsStore.js: call before the fetch, then pass it the count.
// A count fetched before a local set lands is dropped. Failures keep the last
// count: a badge is a hint.
export function beginHomeBaseRequestsRefresh() {
  const started = version;
  return (next) => {
    if (started === version) emit(next);
  };
}

// A number, or a function of the current count (one decided: n => n - 1).
export function setHomeBaseRequestsCount(next) {
  version += 1;
  emit(typeof next === 'function' ? next(count) : next);
}
