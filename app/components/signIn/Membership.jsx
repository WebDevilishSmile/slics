import { auth } from '@/auth';
import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import RequestAccess from './RequestAccess';
import { isMobileDevice, serializeUser } from '@/utils/functions';
import { headers } from 'next/headers';

async function Membership() {
  // Ensure the auth function is called to get the session
  // This is necessary to check if the user is logged in
  const session = await auth();
  const user = session?.user;

  // Check if the user is using a mobile device
  // This is done by checking the User-Agent header
  // We use the headers function from Next.js to get the request headers
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  const isMobile = isMobileDevice(userAgent);

  // If the user is not logged in, we return a message prompting them to sign in
  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', my: '2rem' }}>
        <Typography
          variant='body2'
          sx={{
            maxWidth: '55rem',
            textAlign: 'center',
            my: '1rem',
            px: '1rem',
          }}
        >
          You must be signed in to access your membership.
        </Typography>
      </Box>
    );
  }

  // If the user is logged in, but not a member, we display the membership prompt
  return (
    <Box sx={{ textAlign: 'center', my: '2rem' }}>
      <Typography
        variant='body2'
        sx={{
          maxWidth: '55rem',
          textAlign: 'center',
          my: '1rem',
          px: '1rem',
        }}
      >
        Welcome {user.name.split(' ')[0]}! Now that you have an account, you can
        become a member on Buy Me a Coffee to access your dashboard and other
        member-only features.
      </Typography>

      <Button
        type='submit'
        variant='contained'
        href='https://buymeacoffee.com/tiagodavila/membership'
        target='_blank'
        rel='noopener noreferrer'
      >
        Buy Me a Coffee
      </Button>

      {/* Request Access Component */}
      <RequestAccess user={user} isMobile={isMobile} />
    </Box>
  );
}

export default Membership;
