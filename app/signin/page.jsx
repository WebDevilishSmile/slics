import { Box, Button, Typography } from '@mui/material';
import PageContainer from '../components/layout/PageContainer';
import { Google } from '@mui/icons-material';
import { signIn } from '@/auth';

function SigninPage() {
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
      </Box>
    </PageContainer>
  );
}

export default SigninPage;
