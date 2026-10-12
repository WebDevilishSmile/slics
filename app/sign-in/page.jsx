import { getSession } from '@/lib/authz';
import { getUserById } from '@/lib/db/users';
import { safeCallbackUrl } from '@/lib/callbackUrl';

import PageContainer from '@/components/layout/PageContainer';
import { Link, Typography } from '@mui/material';
import Membership from '@/components/signIn/Membership';
import SignIn from '@/components/signIn/SignIn';
import RedirectMember from '@/components/signIn/RedirectMember';

export const metadata = {
  title: 'Sign in · SLICs',
};

// The sign-in page (auth.config.js `pages.signIn`). `callbackUrl` is where a
// signed-out driver was headed (middleware.js). Sign-in comes back here with
// it, so a non-member still sees the membership prompt; a member goes
// straight on, and "Use SLICs now" takes a non-member there.
export default async function SignInPage({ searchParams }) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl, null);
  const next = callbackUrl ?? '/home';

  const session = await getSession();
  // By id, never by email (docs/SECURITY.md #19).
  const user = session ? await getUserById(session.user.id) : null;

  if (user?.bmcMember) {
    return <RedirectMember userName={user.name.split(' ')[0]} to={next} />;
  }

  return (
    <PageContainer>
      <Typography variant='sectionHeading' component='h1'>
        {user ? 'Welcome to SLICs' : 'Sign in to SLICs'}
      </Typography>
      {user ? (
        <Membership next={next} />
      ) : (
        <>
          <SignIn callbackUrl={callbackUrl} />
          <Typography variant='body2' sx={{ mt: 3, textAlign: 'center' }}>
            New to SLICs? <Link href='/help#sign-in'>See how to sign in</Link>
          </Typography>
        </>
      )}
    </PageContainer>
  );
}
