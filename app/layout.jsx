import { Box, InitColorSchemeScript } from '@mui/material';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Montserrat } from 'next/font/google';
import './globals.css';

import { SITE_URL } from '@/constants';
import { getSession } from '@/lib/authz';
import { statusBarColors } from '@/theme';

import Footer from '@/components/footer/Footer';
import Header from '@/components/header/Header';
import Container from '@/components/layout/Container';
import Providers from '@/components/layout/Providers';
import ThemeColorSync from '@/components/layout/ThemeColorSync';

// No `weight`: Montserrat is a variable font, so next/font ships one file
// that covers every weight instead of one per listed weight (UI-SUGGESTIONS.md #39).
const font = Montserrat({
  variable: '--font-font',
  subsets: ['latin'],
  display: 'swap',
});

const description =
  'SLICs is a lookup app for UPS Feeder drivers: enter a SLIC code to get the destination’s address, map link, phone number and driver tips.';

export const metadata = {
  // Absolute URLs for the link preview; its picture is app/opengraph-image.jsx.
  metadataBase: new URL(SITE_URL),
  title: 'SLICs',
  description,
  applicationName: 'SLICs',
  openGraph: {
    type: 'website',
    siteName: 'SLICs',
    title: 'SLICs: the Feeder binder, on your phone',
    description,
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
  // Installed on an iPhone the app runs without Safari chrome; 'default'
  // keeps content below the status bar so no safe-area CSS is needed.
  appleWebApp: { capable: true, title: 'SLICs', statusBarStyle: 'default' },
};

// The browser/status bar matches the header in each color scheme
// (UI-SUGGESTIONS.md #35). These media queries follow the OS setting;
// ThemeColorSync covers a scheme pinned with the menu's Dark mode switch.
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: statusBarColors.light },
    { media: '(prefers-color-scheme: dark)', color: statusBarColors.dark },
  ],
};

// Chrome fires `beforeinstallprompt` as soon as the page is installable, which
// on a slow phone can be before React hydrates. Stash it so useInstallPrompt
// (hooks/useInstallPrompt.js) can pick it up on mount; preventDefault keeps
// Chrome's own mini-infobar from competing with the in-app install UI.
const captureInstallPrompt =
  "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__slicsInstallPrompt=e;});";

export default async function RootLayout({ children }) {
  // Handed to SessionProvider so the browser never fetches it. Round-tripped
  // through JSON so it matches what /api/auth/session would send (the user
  // row's values are Mongo types and Dates, which a client prop can't take).
  const session = await getSession();
  const clientSession = session ? JSON.parse(JSON.stringify(session)) : null;

  return (
    <html lang='en' suppressHydrationWarning>
      <Providers session={clientSession}>
        <body className={font.variable}>
          <InitColorSchemeScript attribute='class' />
          <ThemeColorSync />
          <script dangerouslySetInnerHTML={{ __html: captureInstallPrompt }} />
          <Container>
            <Header />
            {/* The one <main> landmark, here rather than in PageContainer:
                admin/layout.jsx and Suspense fallbacks nest PageContainers.
                It repeats Container's centered column so pages lay out as
                before. */}
            <Box
              component='main'
              sx={{
                flex: '1 0 auto',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {children}
            </Box>
            <Footer />
          </Container>
        </body>
        <Analytics />
        <SpeedInsights />
      </Providers>
    </html>
  );
}
