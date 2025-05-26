import { InitColorSchemeScript } from '@mui/material';
import { Montserrat } from 'next/font/google';

import Container from './components/layout/Container';
import ModeSwitch from './components/layout/ModeSwitch';
import Providers from './components/layout/Providers';

import './globals.css';
import Header from './components/header/Header';

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
          <InitColorSchemeScript />
          <Container>
            <Header />
            {children}
          </Container>
          <ModeSwitch />
        </body>
      </Providers>
    </html>
  );
}
