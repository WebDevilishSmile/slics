import { auth, signIn } from '@/auth';
import { getUserByEmail } from '@/utils/usersApi';
import { MAX_WIDTH } from '@/utils/variables';
import { Box, Button, Card, CardContent, Typography } from '@mui/material'; // No Button, CardActions here
import Image from 'next/image';
import PageContainer from './components/layout/PageContainer'; // Assuming this is a client component
import MembershipActionButtons from './home/MembershipActionButtons';
import RedirectMember from './home/RedirectMember';
import StyledHeading from './components/layout/StyledHeading';
import { Google } from '@mui/icons-material';
import SignIn from './components/signIn/SignIn';
import Membership from './components/signIn/Membership';

export default async function Main() {
  const session = await auth();

  let isLoggedIn = false;
  let isMember = false;

  if (session) {
    const user = await getUserByEmail(session?.user?.email);
    isLoggedIn = !!user; // Check if user is logged in
    isMember = user?.bmcMember;

    if (isLoggedIn && isMember) {
      return <RedirectMember userName={user.name.split(' ')[0]} />;
    }
  }

  return (
    <PageContainer>
      <StyledHeading>SLICs</StyledHeading>
      {!isLoggedIn && !isMember && <SignIn />}
      {isLoggedIn && !isMember && <Membership />}

      {/* <MembershipActionButtons isMember={isMember} isLoggedIn={isLoggedIn} /> */}
    </PageContainer>
  );
}
