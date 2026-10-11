import { Typography } from '@mui/material';

import PageContainer from '@/components/layout/PageContainer';
import ResetPasswordForm from '@/components/resetPassword/ResetPasswordForm';

export const metadata = {
  title: 'Reset password · SLICs',
};

// /reset-password#<token>: sets a new password from a reset link
// (docs/PASSWORD-RESET.md). Public in middleware.js, since whoever opens it
// can't sign in; the link itself is the proof.
export default function ResetPasswordPage() {
  return (
    <PageContainer>
      <Typography variant='sectionHeading' component='h1'>
        Reset your password
      </Typography>
      <ResetPasswordForm />
    </PageContainer>
  );
}
