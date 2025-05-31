import { auth, signIn } from '@/auth';
import { Google } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import PageContainer from '../components/layout/PageContainer';
import RedirectMessage from './RedirectMessage';

async function SigninPage() {
  const session = await auth();

  if (session) {
    // If the user is already signed in, redirect them to the home page
    return <RedirectMessage />;
  }

  return (
    <PageContainer>
      <Typography variant='h2'>Sign In</Typography>

      <Typography sx={{ my: '2rem' }}>
        You must be signed in to continue using SLICs.
      </Typography>

      <Box
        component='form'
        action={async () => {
          'use server';
          await signIn('google', {
            redirectTo: '/',
          });
        }}
      >
        <Button type='submit' variant='contained'>
          &nbsp; <Google />
          oogle Sign in
        </Button>

        {/* <Button href='https://buy.stripe.com/28EbJ12lb2ri8PMg6BabK01'>
          Subscribe
        </Button> */}
      </Box>
    </PageContainer>
  );
}

export default SigninPage;
