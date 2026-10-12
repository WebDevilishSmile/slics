'use client';

import { useSyncExternalStore } from 'react';

// How many "This is a mistake" messages about the cover list are open
// (lib/db/coverDisputes.js), shared between the header menu's badge
// (header/UserMenu.jsx, refetched on every route change) and the list on
// /admin/driver-claims, which sets it as they're closed. The
// lib/driverClaimsStore.js pattern: a dispute counts until an admin closes it.
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

export function useOpenDisputesCount() {
  return useSyncExternalStore(subscribe, () => count, () => 0);
}

// GET /api/cover-disputes. Failures keep the last count: a badge is a hint.
export async function refreshOpenDisputesCount() {
  const started = version;
  try {
    const response = await fetch('/api/cover-disputes', { cache: 'no-store' });
    if (!response.ok) return;
    const { data } = await response.json();
    if (started === version) emit(data.count);
  } catch {
    // Offline; try again on the next route change.
  }
}

// The admin list knows the new count as soon as a dispute is closed.
export function setOpenDisputesCount(next) {
  version += 1;
  emit(next);
}
