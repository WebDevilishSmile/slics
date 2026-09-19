'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useTransition } from 'react';

// Shared "the list is being refreshed" lock for the server-rendered comment
// lists (profile/ProfileComments.jsx, admin/user-page/UserComments.jsx).
// After one CommentDelete succeeds, every delete button in the list disables
// until router.refresh() has actually re-rendered the list, so nobody can
// act on a stale list. useTransition ties `isRefreshing` to the real refresh
// rather than a guessed timeout.
//
// Not used by the home-page comments feature (components/comments/*), which
// is client-fetched and refreshes through its own `refetchComments`.
const CommentRefreshContext = createContext(null);

export function CommentRefreshProvider({ children }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  return (
    <CommentRefreshContext.Provider value={{ isRefreshing, refresh }}>
      {children}
    </CommentRefreshContext.Provider>
  );
}

export function useCommentRefresh() {
  const context = useContext(CommentRefreshContext);
  if (!context) {
    throw new Error('useCommentRefresh must be used within CommentRefreshProvider');
  }
  return context;
}
