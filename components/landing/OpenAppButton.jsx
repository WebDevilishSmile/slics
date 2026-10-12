import theme from '@/theme';
import { Button } from '@mui/material';
import { softContainedSx } from '@/components/utility/soft';

// The page's one solid button, at the top (Hero) and again at the end
// (GetStarted), so a driver who reads down to "Why you sign in" doesn't have
// to scroll back up. /sign-in signs in and signs up, so a new driver isn't
// told they need an account first.
export default function OpenAppButton({ signedIn }) {
  return (
    <Button
      variant='contained'
      size='large'
      href={signedIn ? '/home' : '/sign-in'}
      sx={[softContainedSx(theme), { px: 4, minHeight: '3rem' }]}
    >
      {signedIn ? 'Open SLICs' : 'Sign in or sign up'}
    </Button>
  );
}
