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
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <Providers>
        <body className={`${font.className}`}>
          <InitColorSchemeScript attribute='class' />
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
