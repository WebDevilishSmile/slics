import theme from '@/utils/theme';
import { signIn } from '@/auth';
import { Google } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import EmailAuth from './EmailAuth';

function SignIn() {
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
      <EmailAuth />
    </Box>
  );
}

export default SignIn;
