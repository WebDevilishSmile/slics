'use client';

import Link from 'next/link';

// next/link with prefetching off. Every route renders on demand (the root
// layout reads the session), so a prefetch isn't free: each link in view was a
// function call that rendered the layout, the header and the loading screen.
// The closed header menu stays in the page just off-screen, inside the margin
// next/link watches, so every page load prefetched every menu link: 7 calls
// on /home for an admin, 6 for a signed-out visitor. A tap now asks for its
// page when it happens; app/loading.jsx and header/NavigationProgress.jsx
// cover the wait. Pass `prefetch` to opt a link back in.
//
// The theme renders MUI hrefs through this (theme.js), and ESLint keeps
// next/link imports to this file (eslint.config.mjs).
export default function NextLink({ prefetch = false, ...props }) {
  return <Link prefetch={prefetch} {...props} />;
}
