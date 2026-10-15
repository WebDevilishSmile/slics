'use client';

import { beginOpenDisputesRefresh } from '@/lib/coverDisputesStore';
import { beginCoverJobChangesRefresh } from '@/lib/coverJobChangesStore';
import { beginPendingClaimsRefresh } from '@/lib/driverClaimsStore';
import { beginJobChangesRefresh } from '@/lib/jobChangesStore';
import { beginOpenReportsRefresh } from '@/lib/slicReportsStore';

// Refreshes every count behind the admin's header-menu badge with one call,
// GET /api/admin-alerts (header/UserMenu.jsx, on route changes). It was five
// calls on every route change, each a function with its own session read.
// At most once a minute: a badge is a hint, and the pages that clear one
// (mark seen, resolve, decide) set their own count at once. Each store drops
// its count if it was cleared while this was in flight.
const MIN_INTERVAL_MS = 60 * 1000;
let lastFetchAt = 0;
let inFlight = false;

export async function refreshAdminAlerts() {
  if (inFlight || Date.now() - lastFetchAt < MIN_INTERVAL_MS) return;
  inFlight = true;
  const apply = {
    jobChanges: beginJobChangesRefresh(),
    coverJobChanges: beginCoverJobChangesRefresh(),
    openReports: beginOpenReportsRefresh(),
    pendingClaims: beginPendingClaimsRefresh(),
    openDisputes: beginOpenDisputesRefresh(),
  };
  try {
    const response = await fetch('/api/admin-alerts', { cache: 'no-store' });
    if (!response.ok) return;
    const { data } = await response.json();
    lastFetchAt = Date.now();
    for (const [key, set] of Object.entries(apply)) {
      if (typeof data?.[key] === 'number') set(data[key]);
    }
  } catch {
    // Offline; try again on the next route change. Failures keep the last
    // counts.
  } finally {
    inFlight = false;
  }
}
