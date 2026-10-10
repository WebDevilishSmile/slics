'use client';

import { useEffect, useState } from 'react';
import { Caveat } from 'next/font/google';
import { LocalCafe } from '@mui/icons-material';
import { Box, Button, Dialog, Typography } from '@mui/material';

import { softContainedSx } from '@/components/utility/soft';
import { tapHaptic } from '@/lib/haptics';
import { withViewTransition } from '@/lib/viewTransition';

import Celebration from './Celebration';
import Envelope from './Envelope';

// The signature's handwriting. Only this note uses it, so it isn't preloaded.
const script = Caveat({ subsets: ['latin'], preload: false, display: 'swap' });

// The note's words for each kind of support (`bmc-events` types).
export function noteCopy(type, firstName) {
  const name = firstName ? `, ${firstName}` : '';
  const why =
    'I build SLICs on my own time, so every driver can find the next stop easily.';
  if (type === 'membership.started') {
    return {
      title: `Welcome aboard${name}!`,
      paragraphs: [
        'Thank you for becoming a member. Your SLIC History is waiting for you in the menu.',
        `${why} Your membership keeps it running for all of us.`,
      ],
    };
  }
  if (type === 'recurring_donation.started') {
    return {
      title: `Thank you${name}!`,
      paragraphs: [
        'Thank you for supporting SLICs every month.',
        `${why} Support like yours keeps it running for all of us.`,
      ],
    };
  }
  return {
    title: `Thank you${name}!`,
    paragraphs: [
      'Your coffee made my day.',
      `${why} Support like yours keeps it running for all of us.`,
    ],
  };
}

const overlayShadow = (theme) => ({
  boxShadow: theme.soft.overlay.light,
  ...theme.applyStyles('dark', { boxShadow: theme.soft.overlay.dark }),
});

function Letter({ type, firstName, onClose }) {
  const { title, paragraphs } = noteCopy(type, firstName);
  return (
    <Box
      sx={(theme) => ({
        ...overlayShadow(theme),
        viewTransitionName: 'thank-letter',
        position: 'relative',
        width: 'min(24rem, calc(100vw - 2rem))',
        mt: 3.5,
        px: { xs: 3, sm: 4 },
        pt: 5.5,
        pb: 3,
        borderRadius: 4,
        bgcolor: 'background.default',
      })}
    >
      <Box
        className='pop'
        aria-hidden
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          translate: '-50% -50%',
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'warning.main',
          color: 'warning.contrastText',
          boxShadow:
            '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 0 0 3px rgba(255, 255, 255, 0.25)',
        }}
      >
        <LocalCafe />
      </Box>

      <Typography
        id='thank-you-title'
        variant='h5'
        component='h2'
        sx={{ fontWeight: 700, textAlign: 'center', mb: 2.5 }}
      >
        {title}
      </Typography>
      {paragraphs.map((text, i) => (
        <Typography key={i} className='enter' sx={{ '--i': i + 2, mb: 1.5 }}>
          {text}
        </Typography>
      ))}
      <Typography
        variant='body2'
        color='text.secondary'
        className='enter'
        sx={{ '--i': 5, mt: 2.5 }}
      >
        With gratitude,
      </Typography>
      <Typography
        variant='h3'
        component='p'
        className='enter'
        sx={{
          '--i': 6,
          fontFamily: script.style.fontFamily,
          fontWeight: 600,
          color: 'primary.main',
          lineHeight: 1.1,
        }}
      >
        Tiago
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
        <Button
          variant='contained'
          onClick={onClose}
          autoFocus
          sx={[softContainedSx, { px: 4, minHeight: '3rem' }]}
        >
          Close
        </Button>
      </Box>
    </Box>
  );
}

// The thank-you note (docs/BMC-SUPPORT.md stage 3). Opening it plays the
// envelope: the seal pops, the flap swings up, the letter slides out and
// becomes the full note (a View Transition morph), and confetti and balloons
// fly. Under reduced motion it opens straight to the letter, with no
// celebration. `type` is the support's event type; `onClose` runs on Close,
// Escape or a tap outside.
export default function ThankYouNote({ open, onClose, type, firstName }) {
  const [stage, setStage] = useState('closed');
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage('read');
      return undefined;
    }
    const timers = [
      setTimeout(() => setStage('opening'), 450),
      setTimeout(() => setStage('peek'), 1050),
      setTimeout(() => {
        withViewTransition(() => setStage('read'));
        setBurst((n) => n + 1);
        tapHaptic(30);
      }, 1800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [open]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby={stage === 'read' ? 'thank-you-title' : undefined}
        aria-label={
          stage === 'read' ? undefined : 'A thank-you note from Tiago'
        }
        slotProps={{
          // The envelope floats on the backdrop by itself; the letter brings
          // its own card. So the Dialog's paper is only a centering box.
          paper: {
            sx: (theme) => ({
              bgcolor: 'transparent',
              backgroundImage: 'none',
              boxShadow: 'none',
              ...theme.applyStyles('dark', { boxShadow: 'none' }),
              overflow: 'visible',
              alignItems: 'center',
              maxWidth: 'none',
              m: 2,
            }),
          },
          transition: { onExited: () => setStage('closed') },
        }}
      >
        {stage === 'read' ? (
          <Letter type={type} firstName={firstName} onClose={onClose} />
        ) : (
          <Box sx={{ py: 10 }}>
            <Envelope stage={stage} width='20rem' named />
          </Box>
        )}
      </Dialog>
      <Celebration burst={burst} />
    </>
  );
}
