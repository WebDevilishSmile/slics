'use client';

import theme from '@/theme';

import { SessionProvider } from 'next-auth/react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import SessionSync from './SessionSync';

function Providers({ session, children }) {
  return (
    // No session fetch from the browser: the root layout passes the one it
    // already read, and nothing re-fetches it each time the app comes back
    // into view. Drivers flip to Maps and back all day, and every return was
    // a function call plus a user-row read (/api/auth/session was the
    // most-called route). SessionSync catches a later server render that sees
    // a different session.
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <SessionSync session={session} />
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {children}
            <CssBaseline />
          </LocalizationProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </SessionProvider>
  );
}

export default Providers;
