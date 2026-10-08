import theme from '@/theme';
import { signIn } from '@/auth';
import { Google } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';
import { softPressSx, softRaisedSmall } from '../utility/soft';
import EmailAuth from './EmailAuth';

// Sign-in on `/` for a signed-out visitor: one soft panel. The email form's
// Sign In is the panel's one solid blue button, so Google is a raised pill.
// Both come back to `/`, keeping `callbackUrl` (app/page.jsx).
function SignIn({ callbackUrl }) {
  const returnTo = callbackUrl
    ? `/?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/';

  return (
    <Paper
      variant='panel'
      className='enter'
      sx={{ minHeight: 0, alignItems: 'stretch', px: { xs: 3, sm: 4 } }}
    >
      <Typography variant='body2' sx={{ textAlign: 'center', mb: 3 }}>
        Sign in or create an account using Google or email and password.
      </Typography>
      <Box
        component='form'
        action={async () => {
          'use server';
          await signIn('google', {
            redirectTo: returnTo,
          });
        }}
      >
        <Button
          type='submit'
          fullWidth
          startIcon={<Google />}
          sx={[
            softRaisedSmall(theme),
            softPressSx(theme),
            { minHeight: '3rem' },
          ]}
        >
          Continue with Google
        </Button>
      </Box>
      <EmailAuth returnTo={returnTo} />
    </Paper>
  );
}

export default SignIn;
