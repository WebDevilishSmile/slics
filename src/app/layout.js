import { Montserrat } from 'next/font/google';
import './globals.css';
import ThemeRegistry from './ThemeRegistry';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Header from './components/Header';
import Footer from './components/Footer';

const montserrat = Montserrat({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
});
export const metadata = {
  title: 'SLICs',
  description: 'Developed by Tiago Davila',
};

export default async function RootLayout(props) {
  const { children } = props;

  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body className={montserrat.className}>
        <ThemeRegistry options={{ key: 'mui' }}>
          <Header data={data} />
          {children}
          <Footer />
        </ThemeRegistry>
      </body>
    </html>
  );
}
