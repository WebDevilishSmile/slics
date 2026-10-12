import { getSession } from '@/lib/authz';

import PageContainer from '@/components/layout/PageContainer';
import AboutSignIn from '@/components/landing/AboutSignIn';
import Features from '@/components/landing/Features';
import GetStarted from '@/components/landing/GetStarted';
import Hero from '@/components/landing/Hero';

// The landing page: what SLICs is and how to start, public for everyone
// (middleware.js). Sign-in is /sign-in. A signed-in driver sees the same page
// with "Open SLICs" as its button.
export default async function Landing() {
  const session = await getSession();

  return (
    <PageContainer>
      <Hero signedIn={!!session} />
      <Features />
      <GetStarted />
      <AboutSignIn />
    </PageContainer>
  );
}
