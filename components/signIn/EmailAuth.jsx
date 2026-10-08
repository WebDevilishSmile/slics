'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  TextField,
  Typography,
} from '@mui/material';

import { softContainedSx, softInputSx } from '@/components/utility/soft';

// The "Create one" / "Sign in" mode switches (UI-SUGGESTIONS.md #33). They're
// real buttons, so Tab and Enter reach them, styled as links. MUI's button-link
// style sets verticalAlign: 'middle', which drops them off the sentence's
// baseline.
const modeLinkSx = { verticalAlign: 'baseline' };

const formSx = { display: 'flex', flexDirection: 'column', gap: 2.5 };

// `returnTo` is `/`, with the callbackUrl when there is one (SignIn.jsx).
function EmailAuth({ returnTo = '/' }) {
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
        router.push(returnTo);
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
        router.push(returnTo);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      <Typography
        variant='caption'
        color='text.secondary'
        component='p'
        sx={{ textAlign: 'center', mb: 2 }}
      >
        or continue with email
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      {mode === 'signin' ? (
        <Box component='form' onSubmit={handleSignIn} sx={formSx}>
          <TextField
            label='Email'
            type='email'
            fullWidth
            sx={softInputSx}
            required
            autoComplete='email'
            value={signInFields.email}
            onChange={(e) =>
              setSignInFields((f) => ({ ...f, email: e.target.value }))
            }
          />
          <TextField
            label='Password'
            type='password'
            fullWidth
            sx={softInputSx}
            required
            autoComplete='current-password'
            value={signInFields.password}
            onChange={(e) =>
              setSignInFields((f) => ({ ...f, password: e.target.value }))
            }
          />
          <Button
            type='submit'
            variant='contained'
            fullWidth
            disabled={loading}
            sx={[softContainedSx, { minHeight: '3rem' }]}
            startIcon={
              loading ? <CircularProgress size={16} color='inherit' /> : null
            }
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
          <Typography variant='body2' sx={{ textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Link
              component='button'
              type='button'
              onClick={() => switchMode('signup')}
              sx={modeLinkSx}
            >
              Create one
            </Link>
          </Typography>
        </Box>
      ) : (
        <Box component='form' onSubmit={handleSignUp} sx={formSx}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label='First Name'
              fullWidth
              sx={softInputSx}
              required
              autoComplete='given-name'
              value={signUpFields.firstName}
              onChange={(e) =>
                setSignUpFields((f) => ({ ...f, firstName: e.target.value }))
              }
            />
            <TextField
              label='Last Name'
              fullWidth
              sx={softInputSx}
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
            fullWidth
            sx={softInputSx}
            required
            autoComplete='email'
            value={signUpFields.email}
            onChange={(e) =>
              setSignUpFields((f) => ({ ...f, email: e.target.value }))
            }
          />
          <TextField
            label='Password'
            type='password'
            fullWidth
            sx={softInputSx}
            required
            autoComplete='new-password'
            helperText='Minimum 8 characters'
            value={signUpFields.password}
            onChange={(e) =>
              setSignUpFields((f) => ({ ...f, password: e.target.value }))
            }
          />
          <TextField
            label='Confirm Password'
            type='password'
            fullWidth
            sx={softInputSx}
            required
            autoComplete='new-password'
            value={signUpFields.confirmPassword}
            onChange={(e) =>
              setSignUpFields((f) => ({
                ...f,
                confirmPassword: e.target.value,
              }))
            }
          />
          <Button
            type='submit'
            variant='contained'
            fullWidth
            disabled={loading}
            sx={[softContainedSx, { minHeight: '3rem' }]}
            startIcon={
              loading ? <CircularProgress size={16} color='inherit' /> : null
            }
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
          <Typography variant='body2' sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Link
              component='button'
              type='button'
              onClick={() => switchMode('signin')}
              sx={modeLinkSx}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default EmailAuth;
