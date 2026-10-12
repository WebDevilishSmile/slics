import { signIn } from '@/auth';
import { Box } from '@mui/material';
import GoogleButton from './GoogleButton';
import SignInPanel from './SignInPanel';

// Sign-in on /sign-in for a signed-out visitor (SignInPanel.jsx). Google is a
// server-action form, handed to the client panel as an element. Both Google
// and the email forms go straight to `callbackUrl` (the page the driver was
// headed for) or /home; the membership prompt only shows when a non-member
// opens /history (middleware.js sends them back to /sign-in).
function SignIn({ callbackUrl }) {
  const returnTo = callbackUrl ?? '/home';

  return (
    <SignInPanel
      returnTo={returnTo}
      google={
        <Box
          component='form'
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: returnTo });
          }}
        >
          <GoogleButton />
        </Box>
      }
    />
  );
}

export default SignIn;
