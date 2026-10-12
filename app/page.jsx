import { getSession } from '@/lib/authz';
import { getUserById } from '@/lib/db/users';
import { safeCallbackUrl } from '@/lib/callbackUrl';

import PageContainer from '@/components/layout/PageContainer';
import { Link, Typography } from '@mui/material';
import Membership from '@/components/signIn/Membership';
import SignIn from '@/components/signIn/SignIn';
import RedirectMember from '@/components/signIn/RedirectMember';
import { AppIntro, AppTagline } from '@/components/signIn/AppIntro';

// `callbackUrl` is where a signed-out driver was headed (middleware.js). Sign-in
// comes back here with it, so a non-member still sees the membership prompt;
// a member goes straight on, and "Use SLICs now" takes a non-member there.
export default async function Main({ searchParams }) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl, null);
  const next = callbackUrl ?? '/home';

  // Check if the user is logged in
  const session = await getSession();

  let isLoggedIn = false;
  let isMember = false;

  // If the session exists, we check if the user is a member
  // and redirect them if they are already a member
  if (session) {
    // By id, never by email (docs/SECURITY.md #19).
    const user = await getUserById(session.user.id);
    isLoggedIn = !!user; // Check if user is logged in
    isMember = user?.bmcMember;

    if (isLoggedIn && isMember) {
      return <RedirectMember userName={user.name.split(' ')[0]} to={next} />;
    }
  }

  // If the user is not logged in, we display the SignIn component
  // If the user is logged in but not a member, we display the Membership component
  return (
    <PageContainer>
      <Typography variant='h1'>SLICs</Typography>
      {!isLoggedIn && !isMember && (
        <>
          <AppTagline />
          <SignIn callbackUrl={callbackUrl} />
          <Typography variant='body2' sx={{ mt: 3, textAlign: 'center' }}>
            New to SLICs? <Link href='/help#sign-in'>See how to sign in</Link>
          </Typography>
          <AppIntro />
        </>
      )}
      {isLoggedIn && !isMember && <Membership next={next} />}
    </PageContainer>
  );
}
