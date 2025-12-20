'use client';
import { useState, useEffect } from 'react';

export default function HydrationGuard({ children }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    // Return a simple placeholder that matches the Server HTML exactly
    return <div style={{ minHeight: '100px' }} />;
  }

  return <>{children}</>;
}
