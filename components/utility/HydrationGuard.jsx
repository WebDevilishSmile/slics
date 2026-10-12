'use client';
import { useState, useEffect } from 'react';

// Renders `children` only in the browser, after the first render. Until then,
// on the server and in the first client render (the two must match), it shows
// `fallback`: a skeleton shaped like the content where one exists, so what
// the server sends first doesn't jump when the content arrives
// (home/LookupSkeleton.jsx), or else a plain spacer.
export default function HydrationGuard({ children, fallback }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback ?? <div style={{ minHeight: '100px' }} />;
  }

  return <>{children}</>;
}
