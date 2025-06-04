import { auth, signIn } from '@/auth';
import { Google } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import PageContainer from '../components/layout/PageContainer';
import RedirectMessage from '../components/layout/RedirectMessage';

async function SigninPage() {
  const session = await auth();

  if (session) {
    // If the user is already signed in, redirect them to the home page
    return (
      <RedirectMessage
        message='You are already signed in. Redirecting you to the home page...'
        redirect='/home'
      />
    );
  }

  return (
    <PageContainer>
      <Typography variant='h2'>Sign In</Typography>

      <Typography
        sx={{ maxWidth: '55rem', textAlign: 'center', my: '2rem', px: '1rem' }}
      >
        You must be signed in to continue using SLICs.
      </Typography>

      <Box
        component='form'
        action={async () => {
          'use server';
          await signIn('google', {
            redirectTo: '/home',
          });
        }}
      >
        <Button type='submit' variant='contained'>
          &nbsp; <Google />
          oogle Sign in
        </Button>
      </Box>
    </PageContainer>
  );
}

export default SigninPage;
