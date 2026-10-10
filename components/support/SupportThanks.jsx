'use client';

import { useState } from 'react';
import { CloseOutlined } from '@mui/icons-material';
import { Box, ButtonBase, IconButton, Typography } from '@mui/material';

import { softPressSx, softRaised } from '@/components/utility/soft';
import theme from '@/theme';

import Envelope from './Envelope';
import ThankYouNote from './ThankYouNote';

// A one-time thank-you on /home after a driver supports the app on Buy Me a
// Coffee (docs/BMC-SUPPORT.md stage 3). `support` is the newest support not
// yet thanked, from the server. The card holds a sealed envelope; tapping it
// opens the note. Closing the note, or dismissing the card, stamps the
// support so it won't come back.
export default function SupportThanks({ support, firstName }) {
  const [shown, setShown] = useState(!!support);
  const [reading, setReading] = useState(false);
  if (!support) return null;

  const markThanked = () => {
    // Best effort: if it fails, the card shows once more next visit.
    fetch('/api/users/me/thanks', { method: 'POST' }).catch(() => {});
  };

  const closeNote = () => {
    setReading(false);
    setShown(false);
    markThanked();
  };

  const dismiss = () => {
    setShown(false);
    markThanked();
  };

  // The note stays mounted after the card goes, so its confetti can finish.
  return (
    <>
      {shown && (
        <Box
          className='enter'
          sx={[
            softRaised,
            {
              position: 'relative',
              width: '100%',
              maxWidth: theme.layout.width.panel,
              mt: 3,
              borderRadius: 3,
            },
          ]}
        >
          <ButtonBase
            onClick={() => setReading(true)}
            aria-haspopup='dialog'
            sx={[
              softPressSx,
              {
                width: '100%',
                borderRadius: 3,
                p: 2,
                pr: 7,
                gap: 2,
                justifyContent: 'flex-start',
                textAlign: 'left',
              },
            ]}
          >
            <Envelope width='4.5rem' wiggle />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>
                A note for you{firstName ? `, ${firstName}` : ''}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Tap the envelope to open it.
              </Typography>
            </Box>
          </ButtonBase>
          <IconButton
            onClick={dismiss}
            aria-label='Dismiss the note'
            sx={[softPressSx, { position: 'absolute', top: '0.5rem', right: '0.5rem' }]}
          >
            <CloseOutlined fontSize='small' />
          </IconButton>
        </Box>
      )}
      <ThankYouNote open={reading} onClose={closeNote} type={support.type} firstName={firstName} />
    </>
  );
}
