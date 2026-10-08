'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Re-renders the server data, root layout included, when the driver comes
// back to this tab. The Buy Me a Coffee page opens in a new tab, and internal
// links no longer reload the document (UI-SUGGESTIONS.md #53), so without
// this the header (rendered once in the root layout) would keep the
// non-member menu after the purchase until a full reload.
export default function RefreshOnReturn() {
  const router = useRouter();

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [router]);

  return null;
}
