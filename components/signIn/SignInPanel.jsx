'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

import { ACCOUNT_NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/constants';
import { withViewTransition } from '@/lib/viewTransition';
import PasswordField from '@/components/form/PasswordField';
import AnimatedHeight from '@/components/utility/AnimatedHeight';
import ForgotPassword from './ForgotPassword';
import { SIGN_IN_MODES, signInMode, vt } from './signInModes';
import { softContainedSx, softInputSx } from '@/components/utility/soft';

// The mode switches and "Forgot your password?" (UI-SUGGESTIONS.md #33):
// real buttons, so Tab and Enter reach them, styled as links. MUI's
// button-link style sets verticalAlign: 'middle', which drops them off the
// sentence's baseline. The padding and matching negative margin make the tap
// area 44px tall without moving the text.
const linkButtonSx = { verticalAlign: 'baseline', py: 1.5, my: -1.5 };

const formSx = { display: 'flex', flexDirection: 'column', gap: 2.5 };


// Sign-in for a signed-out visitor: the heading, one soft panel with Google
// (`google`, SignIn.jsx's server-action form) over the email forms, and the
// help link. `returnTo` is where a successful sign-in goes: the page they were
// headed for, or /home (app/sign-in/page.jsx).
export default function SignInPanel({ google, returnTo }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Local state, mirrored to `?mode=`, so a switch can commit synchronously
  // inside the View Transition (a URL change alone re-renders too late).
  const [mode, setMode] = useState(() => signInMode(searchParams.get('mode')));

  const headingRef = useRef(null);
  const noticeRef = useRef(null);
  const newPasswordRef = useRef(null);
  // The mode on screen, so only a change of mode moves focus (not the first
  // load, and not dev's double-run of effects).
  const shownMode = useRef(mode);

  // One email for every form, so it carries over when a driver switches.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUp, setSignUp] = useState({
    firstName: '',
    lastName: '',
    password: '',
  });
  const [passwordError, setPasswordError] = useState('');
  // { severity, text, action?: { label, mode } }, shown above the form's button.
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  // A new form gets its heading focused, so keyboard and screen-reader users
  // land on (and hear) "Create your account" instead of on the page body; the
  // tab title follows (a page loaded with `?mode=` gets it from the page's
  // generateMetadata). Not on first load, where the browser's own focus wins.
  useEffect(() => {
    if (shownMode.current === mode) return;
    shownMode.current = mode;
    document.title = `${SIGN_IN_MODES[mode].title} · SLICs`;
    headingRef.current?.focus();
  }, [mode]);

  // Back and Forward between forms animate like a tap does.
  useEffect(() => {
    const onPopState = () => {
      const next = signInMode(
        new URLSearchParams(window.location.search).get('mode')
      );
      withViewTransition(() => {
        setNotice(null);
        setPasswordError('');
        setMode(next);
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // A message appears by the button the driver just tapped, but on a phone a
  // long form can still leave it off-screen.
  useEffect(() => {
    noticeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [notice]);

  function switchMode(next, nextNotice = null) {
    const params = new URLSearchParams(window.location.search);
    if (next === 'signin') params.delete('mode');
    else params.set('mode', next);
    const query = params.toString();
    withViewTransition(() => {
      setNotice(nextNotice);
      setPasswordError('');
      setMode(next);
      // Back returns to the form before.
      window.history.pushState(
        null,
        '',
        query ? `?${query}` : window.location.pathname
      );
    });
  }

  async function handleSignIn(event) {
    event.preventDefault();
    setNotice(null);
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.code === 'rate_limited') {
        setNotice({
          severity: 'error',
          text: 'Too many sign-in attempts. Wait 15 minutes and try again.',
        });
      } else if (result?.error) {
        setNotice({
          severity: 'error',
          text: 'That email and password don’t match. If you joined with Google, use Continue with Google above.',
        });
      } else {
        router.push(returnTo);
        router.refresh();
      }
    } catch {
      setNotice({
        severity: 'error',
        text: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setNotice(null);
    if (signUp.password.length < PASSWORD_MIN_LENGTH) {
      setPasswordError(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
      newPasswordRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName: signUp.firstName.trim(),
          lastName: signUp.lastName.trim(),
          password: signUp.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({
          severity: 'error',
          text: data.error || 'Couldn’t create the account. Please try again.',
          // The email has an account (maybe a Google one, which the message
          // names): the way forward is signing in, with the email carried over.
          action:
            res.status === 409
              ? { label: 'Sign in instead', mode: 'signin' }
              : undefined,
        });
        return;
      }
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password: signUp.password,
        redirect: false,
      });
      if (result?.error) {
        // The account exists; only the automatic sign-in failed.
        setPassword('');
        switchMode('signin', {
          severity: 'success',
          text: 'Account created. Sign in with your new password.',
        });
      } else {
        router.push(returnTo);
        router.refresh();
      }
    } catch {
      setNotice({
        severity: 'error',
        text: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  const noticeAlert = notice && (
    <Alert
      ref={noticeRef}
      severity={notice.severity}
      sx={vt('notice')}
      role={notice.severity === 'error' ? 'alert' : 'status'}
      action={
        notice.action && (
          <Button
            color='inherit'
            size='small'
            onClick={() => switchMode(notice.action.mode)}
            sx={{ minHeight: '2.5rem', whiteSpace: 'nowrap' }}
          >
            {notice.action.label}
          </Button>
        )
      }
    >
      {notice.text}
    </Alert>
  );

  const submitButton = (idle, busy) => (
    <Button
      type='submit'
      variant='contained'
      fullWidth
      disabled={loading}
      sx={[softContainedSx, { minHeight: '3rem' }, vt('submit')]}
      startIcon={
        loading ? <CircularProgress size={16} color='inherit' /> : null
      }
    >
      {loading ? busy : idle}
    </Button>
  );

  let form;
  if (mode === 'forgot') {
    form = (
      <ForgotPassword
        initialEmail={email}
        onBack={() => switchMode('signin')}
      />
    );
  } else if (mode === 'signin') {
    form = (
      <Box component='form' onSubmit={handleSignIn} sx={formSx}>
        <TextField
          label='Email'
          type='email'
          name='email'
          fullWidth
          sx={[softInputSx, vt('email')]}
          required
          autoComplete='username'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label='Password'
          name='password'
          sx={[softInputSx, vt('password')]}
          required
          autoComplete='current-password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {noticeAlert}
        {submitButton('Sign in', 'Signing in…')}
        <Box sx={[formSx, vt('links')]}>
          {/* A reset link by email (docs/PASSWORD-RESET.md stage 3). */}
          <Typography variant='body2' sx={{ textAlign: 'center' }}>
            <Link
              component='button'
              type='button'
              onClick={() => switchMode('forgot')}
              sx={linkButtonSx}
            >
              Forgot your password?
            </Link>
          </Typography>
          <Typography variant='body2' sx={{ textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Link
              component='button'
              type='button'
              onClick={() => switchMode('signup')}
              sx={linkButtonSx}
            >
              Create one
            </Link>
          </Typography>
        </Box>
      </Box>
    );
  } else {
    form = (
      <Box component='form' onSubmit={handleSignUp} sx={formSx}>
        <Box sx={[{ display: 'flex', gap: 1.5 }, vt('names')]}>
          <TextField
            label='First name'
            name='given-name'
            fullWidth
            sx={softInputSx}
            required
            autoComplete='given-name'
            slotProps={{ htmlInput: { maxLength: ACCOUNT_NAME_MAX_LENGTH } }}
            value={signUp.firstName}
            onChange={(e) =>
              setSignUp((f) => ({ ...f, firstName: e.target.value }))
            }
          />
          <TextField
            label='Last name'
            name='family-name'
            fullWidth
            sx={softInputSx}
            required
            autoComplete='family-name'
            slotProps={{ htmlInput: { maxLength: ACCOUNT_NAME_MAX_LENGTH } }}
            value={signUp.lastName}
            onChange={(e) =>
              setSignUp((f) => ({ ...f, lastName: e.target.value }))
            }
          />
        </Box>
        <TextField
          label='Email'
          type='email'
          name='email'
          fullWidth
          sx={[softInputSx, vt('email')]}
          required
          autoComplete='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label='Password'
          name='new-password'
          sx={[softInputSx, vt('password')]}
          required
          autoComplete='new-password'
          inputRef={newPasswordRef}
          error={Boolean(passwordError)}
          helperText={
            passwordError || `At least ${PASSWORD_MIN_LENGTH} characters`
          }
          slotProps={{ htmlInput: { maxLength: PASSWORD_MAX_LENGTH } }}
          value={signUp.password}
          onChange={(e) => {
            setPasswordError('');
            setSignUp((f) => ({ ...f, password: e.target.value }));
          }}
        />
        {noticeAlert}
        {submitButton('Create account', 'Creating account…')}
        <Typography
          variant='body2'
          sx={[{ textAlign: 'center' }, vt('links')]}
        >
          Already have an account?{' '}
          <Link
            component='button'
            type='button'
            onClick={() => switchMode('signin')}
            sx={linkButtonSx}
          >
            Sign in
          </Link>
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Typography
        variant='sectionHeading'
        component='h1'
        ref={headingRef}
        tabIndex={-1}
        sx={[{ '&:focus': { outline: 'none' } }, vt('heading')]}
      >
        {SIGN_IN_MODES[mode].heading}
      </Typography>
      <Paper
        variant='panel'
        className='enter'
        sx={{ minHeight: 0, alignItems: 'stretch', px: { xs: 3, sm: 4 } }}
      >
        <AnimatedHeight>
          {/* Resetting a password has nothing to do with Google. */}
          {mode !== 'forgot' && (
            <Box sx={vt('google')}>
              {google}
              {/* The landing page's promise, where the account is handed over. */}
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ textAlign: 'center', mt: 1.5 }}
              >
                With Google, SLICs gets only your name, email address and
                picture. <Link href='/privacy'>Privacy Policy</Link>
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                component='p'
                sx={{ textAlign: 'center', mt: 3, mb: 2.5 }}
              >
                or use your email
              </Typography>
            </Box>
          )}
          {form}
        </AnimatedHeight>
      </Paper>
      <Typography variant='body2' sx={{ mt: 3, textAlign: 'center' }}>
        New to SLICs? <Link href='/help#sign-in'>See how to sign in</Link>
      </Typography>
    </>
  );
}
