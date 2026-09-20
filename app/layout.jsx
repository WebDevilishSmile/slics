import { InitColorSchemeScript } from '@mui/material';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Montserrat } from 'next/font/google';
import './globals.css';

import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import Container from './components/layout/Container';
import ModeSwitch from './components/layout/ModeSwitch';
import Providers from './components/layout/Providers';

const font = Montserrat({
  variable: '--font-font',
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
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

// The header AppBar is primary.main in both color schemes, so one value
// matches the browser/status bar everywhere.
export const viewport = {
  themeColor: '#039be5',
};

// Chrome fires `beforeinstallprompt` as soon as the page is installable, which
// on a slow phone can be before React hydrates. Stash it so useInstallPrompt
// (utils/clientFunctions.js) can pick it up on mount; preventDefault keeps
// Chrome's own mini-infobar from competing with the in-app install UI.
const captureInstallPrompt =
  "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__slicsInstallPrompt=e;});";

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <Providers>
        <body className={font.variable}>
          <InitColorSchemeScript attribute='class' />
          <script dangerouslySetInnerHTML={{ __html: captureInstallPrompt }} />
          <Container>
            <Header />
            {children}
            <Footer />
          </Container>
          <ModeSwitch />
        </body>
        <Analytics />
        <SpeedInsights />
      </Providers>
    </html>
  );
}
