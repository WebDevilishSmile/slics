import { auth } from '@/auth';
import { getUserByEmail } from '@/utils/usersApi';
import { safeCallbackUrl } from '@/utils/functions';

import PageContainer from './components/layout/PageContainer';
import { Typography } from '@mui/material';
import Membership from './components/signIn/Membership';
import SignIn from './components/signIn/SignIn';
import RedirectMember from './components/home/RedirectMember';

// `callbackUrl` is where a signed-out driver was headed (middleware.js). Sign-in
// comes back here with it, so a non-member still sees the membership prompt;
// a member goes straight on, and "Use SLICs now" takes a non-member there.
export default async function Main({ searchParams }) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl, null);
  const next = callbackUrl ?? '/home';

  // Check if the user is logged in
  const session = await auth();

  let isLoggedIn = false;
  let isMember = false;

  // If the session exists, we check if the user is a member
  // and redirect them if they are already a member
  if (session) {
    const user = await getUserByEmail(session?.user?.email);
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
      {!isLoggedIn && !isMember && <SignIn callbackUrl={callbackUrl} />}
      {isLoggedIn && !isMember && <Membership next={next} />}
    </PageContainer>
  );
}
