import { auth } from '@/auth';
import { Box, Button, SvgIcon, Typography } from '@mui/material';
import theme from '@/utils/theme';
import Link from 'next/link';
import RequestAccess from './RequestAccess';
import { isMobileDevice, serializeUser } from '@/utils/functions';
import { headers } from 'next/headers';
import Image from 'next/image';

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
    <Box
      sx={{
        maxWidth: theme.layout.maxWidth,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        my: '2rem',
        gap: '1rem',
      }}
    >
      <Typography
        variant='body2'
        sx={{
          textAlign: 'center',
          my: '1rem',
          px: '1rem',
        }}
      >
        Welcome {user.name.split(' ')[0]}! Now that you have an account, you can
        access all the SLIC locations. I strive to maintain a database of
        reliable resources. I have put many hours of work into creating this
        site and maintaining the databases. Please consider donating or becoming
        a member on Buy Me a Coffee.
      </Typography>

      <Button
        type='submit'
        variant='contained'
        href='https://buymeacoffee.com/tiagodavila'
        target='_blank'
        rel='noopener noreferrer'
        sx={{ backgroundColor: '#f7f7f7', color: 'black' }}
      >
        <Image
          src='/bmc-brand-logo.svg'
          width={148}
          height={24}
          alt='Buy Me a Coffee'
        />
      </Button>

      <Typography
        variant='body2'
        sx={{
          textAlign: 'center',
          my: '1rem',
          px: '1rem',
        }}
      >
        If you would like immediate access, click the link below but don&apos;t
        forget to support me in the future!
      </Typography>
      <Button variant='contained' href='/home'>
        Use SLICs now
      </Button>

      {/* Request Access Component
      <RequestAccess user={user} isMobile={isMobile} /> */}
    </Box>
  );
}

export default Membership;
