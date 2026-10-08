'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LinearProgress } from '@mui/material';

// Waits this long before showing, so a prefetched page that opens at once
// never flashes the bar.
const SHOW_AFTER_MS = 150;
// Gives up after this long in case a navigation never lands (an error page
// that keeps the URL, a cancelled tap), so the bar can't hang around.
const GIVE_UP_AFTER_MS = 15000;

// The internal page a click is about to open, or null when the click won't
// start a client-side navigation: a new tab, a download, a modified click,
// another site, or the page that's already open (hash links included).
function navigationTarget(event) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return null;
  }
  const anchor = event.target.closest?.('a[href]');
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return null;
  }
  return url;
}

// A thin bar along the bottom of the app header while a tapped internal link
// loads (UI-SUGGESTIONS.md #53). The theme makes MUI's links next/link, so a
// tap is a client-side navigation; this shows the wait for a page that has
// to render on the server first. It starts on the tap and stops when the URL
// changes. Programmatic navigations (router.push) don't show it. Needs a
// <Suspense> above it for useSearchParams.
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const timers = useRef([]);

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setVisible(false);
  }, []);

  // The new page is in: done.
  useEffect(() => stop(), [pathname, searchParams, stop]);

  useEffect(() => {
    const onClick = (event) => {
      if (!navigationTarget(event)) return;
      stop();
      timers.current = [
        setTimeout(() => setVisible(true), SHOW_AFTER_MS),
        setTimeout(stop, GIVE_UP_AFTER_MS),
      ];
    };
    // Capture, so it sees the tap even when a handler stops it bubbling.
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      stop();
    };
  }, [stop]);

  if (!visible) return null;
  return (
    <LinearProgress
      aria-label='Loading page'
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '0.1875rem',
        // White-ish on the brand-blue header in both schemes.
        color: 'text.light',
        bgcolor: 'transparent',
      }}
      color='inherit'
    />
  );
}
