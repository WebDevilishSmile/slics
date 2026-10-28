'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from '@/components/utility/NextLink';
import { CheckCircleOutline, LinkOffOutlined } from '@mui/icons-material';
import { Box, Button, Paper, Skeleton, Typography } from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { softContainedSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';

// A panel's message with a blue icon above it, like /reset-password's.
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

// /confirm-email#<token> (docs/SECURITY.md #8): confirms a password account's
// email from the link sent at sign-up or from /profile. The token is in the
// fragment, which never reaches the server, Vercel's logs or analytics. It's
// read once on mount, wiped from the address bar and sent at once: opening
// the link is the confirmation, signed in or not.
export default function ConfirmEmail() {
  const { data: session } = useSession();
  // 'reading' until the fragment is read, then 'missing', 'sending', 'done'
  // or 'failed' (with `error`).
  const [state, setState] = useState('reading');
  const [error, setError] = useState('');
  // The token already sent, so a re-run effect (dev's Strict Mode) doesn't
  // spend the link twice and show "already used".
  const sent = useRef(null);

  useEffect(() => {
    const confirm = async () => {
      const token = window.location.hash.slice(1);
      if (!token) {
        if (!sent.current) setState('missing');
        return;
      }
      window.history.replaceState(null, '', window.location.pathname);
      if (sent.current === token) return;
      sent.current = token;
      setState('sending');
      const { error: confirmError } = await apiRequest('/api/auth/confirm-email', { body: { token } });
      if (confirmError) {
        setError(confirmError);
        setState('failed');
        return;
      }
      tapHaptic();
      setState('done');
    };
    confirm();
    // A second link opened in this tab only changes the fragment.
    window.addEventListener('hashchange', confirm);
    return () => window.removeEventListener('hashchange', confirm);
  }, []);

  // Where a new link comes from: the profile, once signed in.
  const profileHref = session?.user?.id ? `/profile/${session.user.id}` : '/sign-in';
  const newLinkButton = (
    <Button
      LinkComponent={Link}
      href={profileHref}
      sx={[softRaisedSmall, softPressSx, { mt: 1, px: 3, minHeight: '3rem' }]}
    >
      {session?.user?.id ? 'Go to your profile' : 'Go to sign-in'}
    </Button>
  );
  const newLinkText = session?.user?.id
    ? 'Send a new one from your profile: tap Send link next to your email.'
    : 'Sign in, then send a new one from your profile: tap Send link next to your email.';

  let content;
  if (state === 'reading' || state === 'sending') {
    content = (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Skeleton variant='circular' width='2.25rem' height='2.25rem' />
        <Skeleton variant='rounded' width='60%' height='1.75rem' sx={{ borderRadius: 2 }} />
        <Skeleton variant='rounded' width='85%' height='1.25rem' sx={{ borderRadius: 2 }} />
      </Box>
    );
  } else if (state === 'done') {
    content = (
      <Outcome icon={<CheckCircleOutline fontSize='large' className='pop' />} title='Your email is confirmed'>
        <Typography color='text.secondary'>
          Thanks. Nobody else can claim your address now, and a Buy Me a Coffee membership will
          find your account.
        </Typography>
        <Button
          variant='contained'
          LinkComponent={Link}
          href='/home'
          sx={[softContainedSx, { mt: 1, px: 4, minHeight: '3rem' }]}
        >
          Open SLICs
        </Button>
      </Outcome>
    );
  } else if (state === 'missing') {
    content = (
      <Outcome icon={<LinkOffOutlined fontSize='large' />} title='This link is missing its code'>
        <Typography color='text.secondary'>
          Open the whole link from the email, or get a new one. {newLinkText}
        </Typography>
        {newLinkButton}
      </Outcome>
    );
  } else {
    content = (
      <Outcome icon={<LinkOffOutlined fontSize='large' />} title={error}>
        <Typography color='text.secondary'>{newLinkText}</Typography>
        {newLinkButton}
      </Outcome>
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
