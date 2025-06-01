import { auth } from '@/auth';
import { getUserByEmail } from '@/utils/usersApi';
import { MAX_WIDTH } from '@/utils/variables';
import { Box, Card, CardContent, Typography } from '@mui/material'; // No Button, CardActions here
import Image from 'next/image';
import PageContainer from './components/layout/PageContainer'; // Assuming this is a client component
import MembershipActionButtons from './home/MembershipActionButtons';
import RedirectMember from './home/RedirectMember';

export default async function Main() {
  const session = await auth();

  let isLoggedIn = false;
  let isMember = false;

  if (session) {
    const user = await getUserByEmail(session?.user?.email);
    isLoggedIn = !!user; // Check if user is logged in
    isMember = user?.bmcMember;
    console.log(isMember);
    if (isLoggedIn && isMember) {
      return <RedirectMember userName={user.name.split(' ')[0]} />;
    }
  }

  return (
    <PageContainer>
      <Typography variant='h1'>SLICs</Typography>

      <Typography>
        To use SLICs you must be a member on Buy Me a Coffee
      </Typography>

      <Card sx={{ maxWidth: MAX_WIDTH, mt: '2rem' }}>
        <Box
          sx={{
            position: 'relative',
            height: '10rem',
            bgcolor: 'white',
          }}
        >
          <Image
            fill
            src='/bmc-brand-logo.svg'
            alt='Buy Me a Coffee'
            style={{
              objectFit: 'contain',
              padding: '1rem',
            }}
          />
        </Box>
        <CardContent sx={{ px: '2rem', py: '1rem' }}>
          <Typography>
            Buy Me a Coffee is a platform that allows you to support creators by
            making small donations. With a subscription, you can access all of
            the SLICs app features. This subscription fee helps support the
            developer's efforts to maintain the app and add new features.
          </Typography>
        </CardContent>

        {/* Render the Client Component here */}
        <MembershipActionButtons isMember={isMember} isLoggedIn={isLoggedIn} />
      </Card>
    </PageContainer>
  );
}
