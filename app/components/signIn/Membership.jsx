import { auth } from '@/auth';
import { Box, Button, Paper, Typography } from '@mui/material';
import theme from '@/theme';
import Link from 'next/link';
import RequestAccess from './RequestAccess';
import { isMobileDevice } from '@/lib/format';
import { serializeUser } from '@/lib/serializers';
import { headers } from 'next/headers';
import BmcButton from '../layout/BmcButton';
import RefreshOnReturn from './RefreshOnReturn';
import { softContainedSx } from '../utility/soft';

// `next` is where "Use SLICs now" goes: the page they were headed for, or /home.
async function Membership({ next = '/home' }) {
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
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography
          variant='body2'
          sx={{
            maxWidth: theme.layout.width.wide,
            textAlign: 'center',
            my: 2,
            px: 2,
          }}
        >
          You must be signed in to access your membership.
        </Typography>
      </Box>
    );
  }

  // If the user is logged in, but not a member, we display the membership prompt
  return (
    <Paper
      variant='panel'
      className='enter'
      sx={{ minHeight: 0, textAlign: 'center', gap: 3, px: { xs: 3, sm: 4 } }}
    >
      <Typography variant='body2'>
        Welcome {user.name.split(' ')[0]}! Now that you have an account, you can
        access all the SLIC locations. I strive to maintain a database of
        reliable resources. I have put many hours of work into creating this
        site and maintaining the databases. Please consider donating or becoming
        a member on Buy Me a Coffee.
      </Typography>

      <BmcButton />
      <RefreshOnReturn />

      <Typography variant='body2'>
        If you would like immediate access, click the link below but don&apos;t
        forget to support me in the future!
      </Typography>
      <Button
        variant='contained'
        href={next}
        sx={[softContainedSx(theme), { px: 3, minHeight: '3rem' }]}
      >
        Use SLICs now
      </Button>

      {/* Request Access Component
      <RequestAccess user={user} isMobile={isMobile} /> */}
    </Paper>
  );
}

export default Membership;
