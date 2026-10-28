'use client';

import { useState } from 'react';
import { CheckCircleOutline } from '@mui/icons-material';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// Under the email on /profile while a password account's email isn't
// confirmed (docs/SECURITY.md #8): "Not confirmed" and Send link, which emails
// a new link (POST /api/users/me/email-confirmation). It confirms in place,
// the button giving way to "Link sent" in a polite live region, like the
// copy button on the /home card. An error says why under it.
export default function ConfirmEmailButton() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setSending(true);
    setError('');
    const { error: sendError } = await apiRequest('/api/users/me/email-confirmation');
    setSending(false);
    if (sendError) return setError(sendError);
    tapHaptic();
    setSent(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, mt: 0.5 }}>
      <Box role='status' aria-live='polite'>
        {sent ? (
          <Typography variant='body2' color='text.secondary' sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CheckCircleOutline fontSize='small' color='primary' className='pop' />
            Link sent. Check your inbox.
          </Typography>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            Not confirmed
          </Typography>
        )}
      </Box>
      {!sent && (
        <Button
          size='small'
          onClick={send}
          disabled={sending}
          startIcon={sending ? <CircularProgress size={14} color='inherit' /> : null}
          sx={[softRaisedSmall, softPressSx, { px: 2, minHeight: '2.5rem' }]}
        >
          {sending ? 'Sending…' : 'Send link'}
        </Button>
      )}
      {error && (
        <Typography variant='body2' color='error' role='alert'>
          {error}
        </Typography>
      )}
    </Box>
  );
}
