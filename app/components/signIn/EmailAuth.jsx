'use client';

import theme from '@/utils/theme';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from '@mui/material';

function EmailAuth() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [signInFields, setSignInFields] = useState({ email: '', password: '' });
  const [signUpFields, setSignUpFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  function switchMode(next) {
    setMode(next);
    setError('');
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: signInFields.email.trim().toLowerCase(),
        password: signInFields.password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email or password.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError('');
    const { firstName, lastName, email, password, confirmPassword } =
      signUpFields;
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setError('Account created. Please sign in.');
        switchMode('signin');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: theme.layout.width.field, mx: 'auto', mt: 3 }}>
      <Divider sx={{ mb: 3 }}>
        <Typography variant='caption' color='text.secondary'>
          or continue with email
        </Typography>
      </Divider>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {mode === 'signin' ? (
        <Box component='form' onSubmit={handleSignIn}>
          <TextField
            label='Email'
            type='email'
            size='small'
            fullWidth
            required
            autoComplete='email'
            value={signInFields.email}
            onChange={(e) =>
              setSignInFields((f) => ({ ...f, email: e.target.value }))
            }
            sx={{ mb: 1.5 }}
          />
          <TextField
            label='Password'
            type='password'
            size='small'
            fullWidth
            required
            autoComplete='current-password'
            value={signInFields.password}
            onChange={(e) =>
              setSignInFields((f) => ({ ...f, password: e.target.value }))
            }
            sx={{ mb: 2 }}
          />
          <Button
            type='submit'
            variant='contained'
            fullWidth
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={16} color='inherit' /> : null
            }
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
          <Typography variant='body2' sx={{ mt: 1.5, textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Box
              component='span'
              onClick={() => switchMode('signup')}
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            >
              Create one
            </Box>
          </Typography>
        </Box>
      ) : (
        <Box component='form' onSubmit={handleSignUp}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <TextField
              label='First Name'
              size='small'
              fullWidth
              required
              autoComplete='given-name'
              value={signUpFields.firstName}
              onChange={(e) =>
                setSignUpFields((f) => ({ ...f, firstName: e.target.value }))
              }
            />
            <TextField
              label='Last Name'
              size='small'
              fullWidth
              required
              autoComplete='family-name'
              value={signUpFields.lastName}
              onChange={(e) =>
                setSignUpFields((f) => ({ ...f, lastName: e.target.value }))
              }
            />
          </Box>
          <TextField
            label='Email'
            type='email'
            size='small'
            fullWidth
            required
            autoComplete='email'
            value={signUpFields.email}
            onChange={(e) =>
              setSignUpFields((f) => ({ ...f, email: e.target.value }))
            }
            sx={{ mb: 1.5 }}
          />
          <TextField
            label='Password'
            type='password'
            size='small'
            fullWidth
            required
            autoComplete='new-password'
            helperText='Minimum 8 characters'
            value={signUpFields.password}
            onChange={(e) =>
              setSignUpFields((f) => ({ ...f, password: e.target.value }))
            }
            sx={{ mb: 1.5 }}
          />
          <TextField
            label='Confirm Password'
            type='password'
            size='small'
            fullWidth
            required
            autoComplete='new-password'
            value={signUpFields.confirmPassword}
            onChange={(e) =>
              setSignUpFields((f) => ({
                ...f,
                confirmPassword: e.target.value,
              }))
            }
            sx={{ mb: 2 }}
          />
          <Button
            type='submit'
            variant='contained'
            fullWidth
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={16} color='inherit' /> : null
            }
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
          <Typography variant='body2' sx={{ mt: 1.5, textAlign: 'center' }}>
            Already have an account?{' '}
            <Box
              component='span'
              onClick={() => switchMode('signin')}
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sign in
            </Box>
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default EmailAuth;
