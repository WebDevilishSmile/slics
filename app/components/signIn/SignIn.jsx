import { signIn } from '@/auth';
import { Google, Microsoft } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import EmailAuth from './EmailAuth';

function SignIn() {
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
        Sign in or create an account using Google or email and password.
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
          oogle
        </Button>
      </Box>
      <Box
        component='form'
        action={async () => {
          'use server';
          await signIn('azure-ad', {
            redirectTo: '/',
          });
        }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: '1rem',
        }}
      >
        <Button type='submit' variant='contained' disabled>
          <Microsoft /> Microsoft
        </Button>
        <Typography variant='caption'>
          Microsoft sign-in is in development.
        </Typography>
      </Box>
      <EmailAuth />
    </Box>
  );
}

export default SignIn;
