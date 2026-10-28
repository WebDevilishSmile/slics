import { Typography } from '@mui/material';

import ConfirmEmail from '@/components/confirmEmail/ConfirmEmail';
import PageContainer from '@/components/layout/PageContainer';

export const metadata = {
  title: 'Confirm email · SLICs',
};

// /confirm-email#<token>: confirms a password account's email from the link
// sent at sign-up or from /profile (docs/SECURITY.md #8). Public in
// middleware.js, since the link may open in a mail app's browser that isn't
// signed in; the link itself is the proof.
export default function ConfirmEmailPage() {
  return (
    <PageContainer>
      <Typography variant='sectionHeading' component='h1'>
        Confirm your email
      </Typography>
      <ConfirmEmail />
    </PageContainer>
  );
}
