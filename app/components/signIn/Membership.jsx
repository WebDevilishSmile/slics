import { auth } from '@/auth';
import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import RequestAccess from './RequestAccess';
import { serializeUser } from '@/utils/functions';

async function Membership() {
  const session = await auth();
  const user = session?.user;

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

      <RequestAccess user={user} />
    </Box>
  );
}

export default Membership;
