'use client';

import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Check, ContentCopy, SmsOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import {
  softContainedSx,
  softInset,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

const COPY_FEEDBACK_MS = 1500;
const buttonSx = [softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }];

// "Reset password" on /admin/users (docs/PASSWORD-RESET.md stage 1). Asks
// first, then makes a one-time link that works for 24 hours, for the admin to
// copy or text to the driver. The link lives only in this dialog's state:
// closing it forgets the link, and the server keeps only a hash.
export default function ResetPasswordDialog({ open, onClose, user }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState(null); // { url, expiresAt }
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef(null);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleClose = () => {
    onClose();
    setLink(null);
    setError('');
    setCopied(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    const { data, error: createError } = await apiRequest(
      `/api/users/${user._id}/password-reset`,
    );
    setLoading(false);
    if (createError) {
      setError(createError);
      return;
    }
    setLink(data);
  };

  const handleCopy = async () => {
    clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      tapHaptic();
      resetTimer.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      setError("Couldn't copy the link. Select it and copy it by hand.");
    }
  };

  const firstName = user.name?.split(' ')[0] || 'the driver';
  // `sms:<number>?&body=` opens the messages app on both iPhone and Android.
  const smsHref = link
    ? `sms:${(user.phone ?? '').replace(/[^\d+]/g, '')}?&body=${encodeURIComponent(
        `Here's your link to set a new SLICs password. It works once, until ${dayjs(link.expiresAt).format('ddd h:mm A')}: ${link.url}`,
      )}`
    : null;

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby='reset-password-title' fullWidth maxWidth='xs'>
      <DialogTitle id='reset-password-title'>Reset password</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!link ? (
          <Typography>
            Make a link {firstName} can use to set a new password? It works once, for 24 hours.
            Any link made before stops working, and setting the password signs{' '}
            {firstName} out everywhere.
          </Typography>
        ) : (
          <>
            <Typography>
              Send this to {firstName}. It works once, until{' '}
              <strong>{dayjs(link.expiresAt).format('ddd, MMM D, h:mm A')}</strong>. It won&apos;t be
              shown again.
            </Typography>
            <Box
              sx={[
                softInset,
                {
                  borderRadius: 3,
                  p: 2,
                  overflowWrap: 'anywhere',
                  fontFamily: 'monospace',
                  typography: 'body2',
                  userSelect: 'all',
                },
              ]}
            >
              {link.url}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              <Button
                onClick={handleCopy}
                startIcon={copied ? <Check color='success' className='pop' /> : <ContentCopy />}
                sx={buttonSx}
              >
                {copied ? 'Copied' : 'Copy link'}
              </Button>
              <Button href={smsHref} startIcon={<SmsOutlined />} sx={buttonSx}>
                Text it
              </Button>
            </Box>
            <Box component='span' role='status' aria-live='polite' sx={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
              {copied ? 'Link copied' : ''}
            </Box>
          </>
        )}
        {error && <Alert severity='error'>{error}</Alert>}
      </DialogContent>
      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        {!link ? (
          <>
            <Button onClick={handleClose} sx={[softRaisedSmall, softPressSx, { minHeight: '3rem' }]}>
              Cancel
            </Button>
            <Button
              variant='contained'
              onClick={handleCreate}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color='inherit' /> : null}
              sx={[softContainedSx, { minHeight: '3rem' }]}
            >
              {loading ? 'Making link…' : 'Make link'}
            </Button>
          </>
        ) : (
          <Button variant='contained' onClick={handleClose} sx={[softContainedSx, { minHeight: '3rem' }]}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
