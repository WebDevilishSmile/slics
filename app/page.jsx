import { getSession } from '@/lib/authz';

import PageContainer from '@/components/layout/PageContainer';
import AboutSignIn from '@/components/landing/AboutSignIn';
import Features from '@/components/landing/Features';
import GetStarted from '@/components/landing/GetStarted';
import Hero from '@/components/landing/Hero';

// The landing page: what SLICs is and how to start, public for everyone
// (middleware.js). Sign-in is /sign-in. A signed-in driver sees the same page
// with "Open SLICs" as its button. Trust ("Why you sign in") comes before the
// steps, and the steps end on the button again.
export default async function Landing() {
  const session = await getSession();
  const signedIn = !!session;

  return (
    <PageContainer>
      <Hero signedIn={signedIn} />
      <Features />
      <AboutSignIn />
      <GetStarted signedIn={signedIn} />
    </PageContainer>
  );
}
