import { InitColorSchemeScript } from '@mui/material';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Montserrat } from 'next/font/google';
import './globals.css';

import { statusBarColors } from '@/theme';

import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import Container from './components/layout/Container';
import Providers from './components/layout/Providers';
import ThemeColorSync from './components/layout/ThemeColorSync';

// No `weight`: Montserrat is a variable font, so next/font ships one file
// that covers every weight instead of one per listed weight (UI-SUGGESTIONS.md #39).
const font = Montserrat({
  variable: '--font-font',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'SLICs',
  description: 'Created By Tiago Davila',
  applicationName: 'SLICs',
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

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <Providers>
        <body className={font.variable}>
          <InitColorSchemeScript attribute='class' />
          <ThemeColorSync />
          <script dangerouslySetInnerHTML={{ __html: captureInstallPrompt }} />
          <Container>
            <Header />
            {children}
            <Footer />
          </Container>
        </body>
        <Analytics />
        <SpeedInsights />
      </Providers>
    </html>
  );
}
