'use client';

import { useState } from 'react';
import { MarkEmailReadOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  TextField,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { RESET_EMAIL_LINK_MINUTES } from '@/constants';
import { softContainedSx, softInputSx } from '@/components/utility/soft';

// A real button styled as a link, on the sentence's baseline (EmailAuth.jsx).
const linkButtonSx = { verticalAlign: 'baseline' };

const formSx = { display: 'flex', flexDirection: 'column', gap: 2.5 };

// For a driver with no email, or whose email never comes.
function Fallback() {
  return (
    <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center' }}>
      No email? Ask the SLICs admin for a reset link. If you signed up with
      Google, you don&apos;t have a password here: use Continue with Google.
    </Typography>
  );
}

// "Forgot your password?" in the email sign-in (docs/PASSWORD-RESET.md stage
// 3): an email field, then the same "check your email" for every address,
// since the server never says whether it has an account. The link itself
// comes by email and opens /reset-password.
export default function ForgotPassword({ initialEmail = '', onBack }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const address = email.trim().toLowerCase();
    const { error: requestError } = await apiRequest('/api/auth/forgot-password', {
      body: { email: address },
    });
    setLoading(false);
    if (requestError) {
      setError(requestError);
      return;
    }
    setSentTo(address);
  };

  const back = (
    <Typography variant='body2' sx={{ textAlign: 'center' }}>
      <Link component='button' type='button' onClick={onBack} sx={linkButtonSx}>
        Back to sign in
      </Link>
    </Typography>
  );

  if (sentTo) {
    return (
      <Box sx={formSx}>
        <Box
          role='status'
          className='enter'
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, textAlign: 'center' }}
        >
          <Box sx={{ color: 'primary.main', display: 'flex' }}>
            <MarkEmailReadOutlined fontSize='large' className='pop' />
          </Box>
          <Typography variant='h6' component='p'>
            Check your email
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            If <Box component='strong' sx={{ color: 'text.primary', overflowWrap: 'anywhere' }}>{sentTo}</Box>{' '}
            has a SLICs account, an email from SLICs is on its way. Its link
            lets you choose a new password, and it works once, for{' '}
            {RESET_EMAIL_LINK_MINUTES} minutes. Not there in a few minutes?
            Check your spam folder.
          </Typography>
        </Box>
        {back}
        <Fallback />
      </Box>
    );
  }

  return (
    <Box component='form' onSubmit={handleSubmit} sx={formSx}>
      <Typography variant='body2' sx={{ textAlign: 'center' }}>
        Enter the email you sign in with, and we&apos;ll send you a link to
        choose a new password.
      </Typography>
      {error && <Alert severity='error'>{error}</Alert>}
      <TextField
        label='Email'
        type='email'
        fullWidth
        sx={softInputSx}
        required
        autoFocus
        autoComplete='email'
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button
        type='submit'
        variant='contained'
        fullWidth
        disabled={loading}
        sx={[softContainedSx, { minHeight: '3rem' }]}
        startIcon={loading ? <CircularProgress size={16} color='inherit' /> : null}
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </Button>
      {back}
      <Fallback />
    </Box>
  );
}
