import { redirect } from 'next/navigation';
import { Typography } from '@mui/material';

import { getSession } from '@/lib/authz';
import { getUserById } from '@/lib/db/users';
import { safeCallbackUrl } from '@/lib/callbackUrl';

import PageContainer from '@/components/layout/PageContainer';
import Membership from '@/components/signIn/Membership';
import SignIn from '@/components/signIn/SignIn';
import { SIGN_IN_MODES, signInMode } from '@/components/signIn/signInModes';

// The tab title follows the form showing (`?mode=`); SignInPanel.jsx keeps
// it in step when a driver switches forms.
export async function generateMetadata({ searchParams }) {
  const mode = signInMode((await searchParams).mode);
  return { title: `${SIGN_IN_MODES[mode].title} · SLICs` };
}

// The sign-in page (auth.config.js `pages.signIn`). `callbackUrl` is where a
// signed-out driver was headed (middleware.js); signing in goes straight
// there, or to /home. A signed-in non-member lands here only from a members'
// page (/history, via middleware.js) and gets the membership prompt; a member
// is sent on.
export default async function SignInPage({ searchParams }) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl, null);
  const next = callbackUrl ?? '/home';

  const session = await getSession();
  // By id, never by email (docs/SECURITY.md #19).
  const user = session ? await getUserById(session.user.id) : null;

  if (user?.bmcMember) redirect(next);

  return (
    <PageContainer>
      {user ? (
        <>
          <Typography variant='sectionHeading' component='h1'>
            Become a member
          </Typography>
          <Membership firstName={user.name.split(' ')[0]} next={next} />
        </>
      ) : (
        <SignIn callbackUrl={callbackUrl} />
      )}
    </PageContainer>
  );
}
