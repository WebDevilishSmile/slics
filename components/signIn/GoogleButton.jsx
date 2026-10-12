'use client';

import { useFormStatus } from 'react-dom';
import { Google } from '@mui/icons-material';
import { Button, CircularProgress } from '@mui/material';

import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// The submit button of SignIn.jsx's Google form. From the tap until Google's
// page loads it shows a spinner and "Opening Google…" and is disabled, so a
// slow connection doesn't look like a missed tap and a second tap can't start
// a second sign-in.
export default function GoogleButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type='submit'
      fullWidth
      disabled={pending}
      startIcon={
        pending ? <CircularProgress size={18} color='inherit' /> : <Google />
      }
      sx={[softRaisedSmall, softPressSx, { minHeight: '3rem' }]}
    >
      {pending ? 'Opening Google…' : 'Continue with Google'}
    </Button>
  );
}
