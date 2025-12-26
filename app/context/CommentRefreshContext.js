'use client';

import { createContext, useContext, useState } from 'react';

const CommentRefreshContext = createContext();

export function CommentRefreshProvider({ children }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <CommentRefreshContext.Provider value={{ isRefreshing, setIsRefreshing }}>
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
