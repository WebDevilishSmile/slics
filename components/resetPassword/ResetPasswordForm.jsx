'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircleOutline,
  LinkOffOutlined,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/constants';
import { softContainedSx, softInputSx, softPressSx } from '@/components/utility/soft';

const formSx = { display: 'flex', flexDirection: 'column', gap: 2.5 };

// A panel's message with a blue icon above it: the "link doesn't work" and
// "done" states.
function Outcome({ icon, title, children }) {
  return (
    <Box role='status' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, textAlign: 'center' }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant='h6' component='p'>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

// /reset-password#<token> (docs/PASSWORD-RESET.md). The token is in the
// fragment, which never reaches the server, Vercel's logs or analytics. It's
// read once on mount and wiped from the address bar, then sent with the new
// password. The page doesn't sign the driver in: they sign in with the new
// password on `/`, where the sign-in limit applies.
export default function ResetPasswordForm() {
  // null until the fragment is read, then the token or ''.
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const readToken = () => {
      const fromHash = window.location.hash.slice(1);
      if (fromHash) {
        window.history.replaceState(null, '', window.location.pathname);
        setError('');
        setDone(false);
      }
      setToken((current) => fromHash || current || '');
    };
    readToken();
    // A second link opened in this tab only changes the fragment, which
    // doesn't reload the page.
    window.addEventListener('hashchange', readToken);
    return () => window.removeEventListener('hashchange', readToken);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('The passwords don’t match.');
      return;
    }
    setLoading(true);
    const { error: resetError } = await apiRequest('/api/auth/reset-password', {
      body: { token, password },
    });
    setLoading(false);
    if (resetError) {
      setError(resetError);
      return;
    }
    setPassword('');
    setConfirm('');
    setDone(true);
  };

  const visibility = (
    <InputAdornment position='end'>
      <IconButton
        onClick={() => setShow((value) => !value)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        edge='end'
        sx={softPressSx}
      >
        {show ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  let content;
  if (token === null) {
    content = (
      <Box sx={formSx}>
        <Skeleton variant='rounded' height='3.5rem' sx={{ borderRadius: 4 }} />
        <Skeleton variant='rounded' height='3.5rem' sx={{ borderRadius: 4 }} />
        <Skeleton variant='rounded' height='3rem' sx={{ borderRadius: 4 }} />
      </Box>
    );
  } else if (done) {
    content = (
      <Outcome icon={<CheckCircleOutline fontSize='large' className='pop' />} title='Password changed'>
        <Typography color='text.secondary'>
          Sign in with your new password. Anywhere you were signed in before, you&apos;ll need to
          sign in again.
        </Typography>
        <Button
          variant='contained'
          LinkComponent={Link}
          href='/'
          sx={[softContainedSx, { mt: 1, px: 4, minHeight: '3rem' }]}
        >
          Sign in
        </Button>
      </Outcome>
    );
  } else if (!token) {
    content = (
      <Outcome icon={<LinkOffOutlined fontSize='large' />} title='This link is missing its code'>
        <Typography color='text.secondary'>
          Open the whole link you were sent, or ask the SLICs admin for a new one. If you sign in
          with Google, you don&apos;t need a password: use the Google button.
        </Typography>
      </Outcome>
    );
  } else {
    content = (
      <Box component='form' onSubmit={handleSubmit} sx={formSx}>
        <Typography variant='body2' sx={{ textAlign: 'center' }}>
          Choose a new password for your SLICs account. The link works once.
        </Typography>
        {error && <Alert severity='error'>{error}</Alert>}
        <TextField
          label='New password'
          type={show ? 'text' : 'password'}
          fullWidth
          required
          autoComplete='new-password'
          autoFocus
          helperText={`At least ${PASSWORD_MIN_LENGTH} characters`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          slotProps={{
            htmlInput: { minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH },
            input: { endAdornment: visibility },
          }}
          sx={softInputSx}
        />
        <TextField
          label='Confirm new password'
          type={show ? 'text' : 'password'}
          fullWidth
          required
          autoComplete='new-password'
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          slotProps={{ htmlInput: { maxLength: PASSWORD_MAX_LENGTH } }}
          sx={softInputSx}
        />
        <Button
          type='submit'
          variant='contained'
          fullWidth
          disabled={loading}
          sx={[softContainedSx, { minHeight: '3rem' }]}
          startIcon={loading ? <CircularProgress size={16} color='inherit' /> : null}
        >
          {loading ? 'Saving…' : 'Change password'}
        </Button>
      </Box>
    );
  }

  return (
    <Paper
      variant='panel'
      className='enter'
      sx={{ mt: 3, minHeight: 0, alignItems: 'stretch', px: { xs: 3, sm: 4 }, py: 4 }}
    >
      {content}
    </Paper>
  );
}
