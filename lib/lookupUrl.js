'use client';

// Moves the lookup screen's URL (`?slic=`) without asking the server for the
// page again. Next.js keeps useSearchParams/usePathname in step with the
// browser's own pushState/replaceState, and Back/Forward restore these entries
// without a request. router.push re-rendered /home on the server for every
// lookup (the session, all the SLICs, the notices, a tip count) for a card
// the driver was already looking at: /home was the most expensive route.
// Only for a URL on the page that's showing; anywhere else, navigate.
export function pushLookupUrl(url) {
  window.history.pushState(null, '', url);
}

export function replaceLookupUrl(url) {
  window.history.replaceState(null, '', url);
}
