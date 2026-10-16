'use client';

import { useState } from 'react';
import { CloseOutlined } from '@mui/icons-material';
import { Box, ButtonBase, IconButton, Typography } from '@mui/material';

import { softPressSx, softRaised } from '@/components/utility/soft';
import { withViewTransition } from '@/lib/viewTransition';
import theme from '@/theme';

import Envelope from './Envelope';

// A one-time card on /home holding a sealed envelope: the thank-you
// (support/SupportThanks.jsx) or the welcome note (staff/WelcomeCard.jsx).
// Tapping it opens the note, and the envelope flies out of the card into it
// (a View Transition: the two envelopes share `name`, never at the same time).
// Closing the note, or dismissing the card, calls `onDone` once, which stamps
// the note so it won't come back. `note({ open, onClose })` renders the note;
// `seal` is the wax's icon (support/Envelope.jsx).
export default function NoteCard({ name, heading, seal, onDone, note }) {
  const [shown, setShown] = useState(true);
  const [reading, setReading] = useState(false);

  const closeNote = () => {
    setReading(false);
    setShown(false);
    onDone();
  };

  const dismiss = () => {
    setShown(false);
    onDone();
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
            onClick={() => withViewTransition(() => setReading(true))}
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
            {/* Once it has flown to the note, the card's spot stays empty. */}
            <Box sx={{ flexShrink: 0, visibility: reading ? 'hidden' : 'visible' }}>
              <Envelope width='4.5rem' wiggle seal={seal} name={reading ? undefined : name} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>{heading}</Typography>
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
      {note({ open: reading, onClose: closeNote })}
    </>
  );
}
