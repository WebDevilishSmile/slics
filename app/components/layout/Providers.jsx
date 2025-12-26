'use client';

import theme from '@/utils/theme';

import { SessionProvider } from 'next-auth/react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { CssBaseline, ThemeProvider } from '@mui/material';

function Providers({ children }) {
  return (
    <SessionProvider>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          {children}
          <CssBaseline />
        </ThemeProvider>
      </AppRouterCacheProvider>
    </SessionProvider>
  );
}

export default Providers;
