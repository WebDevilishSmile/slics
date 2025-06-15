import { auth } from '@/auth';
import { getUserByEmail } from '@/utils/usersApi';

import PageContainer from './components/layout/PageContainer';
import StyledHeading from './components/layout/StyledHeading';
import Membership from './components/signIn/Membership';
import SignIn from './components/signIn/SignIn';
import RedirectMember from './home/RedirectMember';

export default async function Main() {
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
      return <RedirectMember userName={user.name.split(' ')[0]} />;
    }
  }

  // If the user is not logged in, we display the SignIn component
  // If the user is logged in but not a member, we display the Membership component
  return (
    <PageContainer>
      <StyledHeading heading='h1'>SLICs</StyledHeading>
      {!isLoggedIn && !isMember && <SignIn />}
      {isLoggedIn && !isMember && <Membership />}
    </PageContainer>
  );
}
