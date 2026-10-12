'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Caveat } from 'next/font/google';
import { Box, Button, ButtonBase, Dialog, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';

import AnimatedSlicsMark from '@/components/utility/AnimatedSlicsMark';
import { softContainedSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { tapHaptic } from '@/lib/haptics';
import { withViewTransition } from '@/lib/viewTransition';

import Confetti from './Confetti';
import Envelope from './Envelope';

// The signature's handwriting. Only this note uses it, so it isn't preloaded;
// the tucked letter starts the download while the envelope is still shut.
const script = Caveat({ subsets: ['latin'], preload: false, display: 'swap' });

// The note's width: a phone's width less the dialog's margins, up to 24rem.
// The envelope is a little narrower, and the letter tucked inside it is drawn
// at 84% of the envelope's width (0.86 × 0.84 ≈ 0.72), so it's the same
// letter, smaller, at any screen width.
const LETTER_WIDTH = 'min(24rem, calc(100vw - 2rem))';
const ENVELOPE_WIDTH = `calc(${LETTER_WIDTH} * 0.86)`;
const TUCKED_SCALE = 0.72;

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

// The day the support came in, dated the way a letter is: "October 10, 2026",
// in the driver's own time zone. Nothing for a missing or unreadable date.
function letterDate(iso) {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// The signature writes itself once the letter is out: a soft-edged mask
// sweeps left to right across it, like ink going down. The letterhead's heart
// waits for it before it beats and turns into the mark (HEART_ONCE in
// utility/AnimatedSlicsMark.jsx), so change their timing together.
const write = keyframes`
  from { mask-position: 100% 0; }
  to { mask-position: 0 0; }
`;

function Signature({ tucked }) {
  return (
    // h1's size: Caveat runs small, so this reads like a signature, not a heading.
    <Typography
      variant='h1'
      component='p'
      sx={{
        width: 'fit-content',
        pr: 3, // room for the mask's soft edge past the last letter
        fontFamily: script.style.fontFamily,
        fontWeight: 600,
        lineHeight: 1,
        color: 'primary.main',
        rotate: '-4deg',
        transformOrigin: 'left center',
        maskImage: 'linear-gradient(90deg, #000 45%, transparent 55%)',
        maskSize: '220% 100%',
        maskRepeat: 'no-repeat',
        // Unsigned while it's in the envelope, so the letter that comes out
        // matches the one that opens; under reduced motion it's just signed.
        maskPosition: tucked ? '100% 0' : '0 0',
        ...(!tucked && {
          '@media (prefers-reduced-motion: no-preference)': {
            animation: `${write} 1s linear 600ms both`,
          },
        }),
      }}
    >
      Tiago
    </Typography>
  );
}

// The letter: stationery with a heart embossed at the top, the date, the
// words, and Tiago's signature, after which the heart beats and turns into the
// SLICs mark. `tucked` is the copy inside the envelope: the same letter,
// unsigned, its heart still, with nothing focusable or labelled.
function Letter({ ref, type, date, firstName, onClose, tucked = false }) {
  const { title, paragraphs } = noteCopy(type, firstName);
  const dated = letterDate(date);
  const member = type === 'membership.started';
  const buttonSx = { minHeight: '3rem', px: 3 };

  // The main action takes focus as the letter opens. Not with autoFocus:
  // React only honors it on form controls, and Open SLIC History is a link.
  const primary = useRef(null);
  useEffect(() => {
    if (!tucked) primary.current?.focus();
  }, [tucked]);
  return (
    <Box
      ref={ref}
      sx={(theme) => ({
        boxShadow: theme.soft.overlay.light,
        ...theme.applyStyles('dark', { boxShadow: theme.soft.overlay.dark }),
        position: 'relative',
        zIndex: 1, // over the confetti
        width: LETTER_WIDTH,
        px: { xs: 3, sm: 4 },
        pt: 3.5,
        pb: 3,
        borderRadius: 4,
        bgcolor: 'background.default',
        viewTransitionName: tucked ? undefined : 'thank-letter',
      })}
    >
      {/* The letterhead: a heart pressed up out of the paper that, once Tiago
          has signed, turns into the mark. The tucked copy holds its first
          frame, so the letter that comes out starts the way it went in. */}
      <AnimatedSlicsMark
        story='heart'
        paused={tucked}
        sx={(theme) => ({
          mx: 'auto',
          fontSize: '2.75rem',
          color: `color-mix(in srgb, ${theme.vars.palette.primary.main} 22%, ${theme.vars.palette.background.default})`,
          filter: theme.soft.emboss.light,
          ...theme.applyStyles('dark', { filter: theme.soft.emboss.dark }),
        })}
      />
      {dated && (
        <Typography
          component='time'
          dateTime={date}
          variant='body2'
          color='text.secondary'
          sx={{ display: 'block', textAlign: 'right', mt: 1 }}
        >
          {dated}
        </Typography>
      )}
      <Typography
        id={tucked ? undefined : 'thank-you-title'}
        variant='h5'
        component={tucked ? 'p' : 'h2'}
        sx={{ fontWeight: 700, textAlign: 'center', textWrap: 'balance', mt: dated ? 1.5 : 2, mb: 2.5 }}
      >
        {title}
      </Typography>
      {paragraphs.map((text, i) => (
        <Typography key={i} sx={{ mb: 1.5 }}>
          {text}
        </Typography>
      ))}
      <Typography variant='body2' color='text.secondary' sx={{ mt: 3, mb: 0.5 }}>
        With gratitude,
      </Typography>
      <Signature tucked={tucked} />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
        {member ? (
          <>
            <Button onClick={onClose} sx={[softRaisedSmall, softPressSx, buttonSx]}>
              Close
            </Button>
            <Button
              ref={primary}
              variant='contained'
              href='/history'
              onClick={onClose}
              sx={[softContainedSx, buttonSx]}
            >
              Open SLIC History
            </Button>
          </>
        ) : (
          <Button
            ref={primary}
            variant='contained'
            onClick={onClose}
            sx={[softContainedSx, buttonSx, { px: 4 }]}
          >
            Close
          </Button>
        )}
      </Box>
    </Box>
  );
}

// The thank-you note (docs/BMC-SUPPORT.md stage 3). Opening it plays the
// envelope: the wax seal lifts away, the flap swings up, the letter slides
// most of the way out, then comes to the reader as the envelope drops away (a
// View Transition morph) while confetti bursts behind it, then Tiago signs it
// and last the letterhead's heart beats and turns into the SLICs mark. Tapping
// the envelope skips ahead to the letter. Under reduced motion it opens
// straight to the signed letter, under the mark, with no confetti. `type` is
// the support's event type and `date` when it came in (ISO; the letter is
// dated with it); `onClose` runs on Close (or Open SLIC History, on a
// membership's note), Escape or a tap outside.
export default function ThankYouNote({ open, onClose, type, date, firstName }) {
  const [stage, setStage] = useState('closed');
  const [confetti, setConfetti] = useState(false);
  const timers = useRef([]);
  const letter = useRef(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const takeOut = useCallback(() => {
    clearTimers();
    withViewTransition(() => {
      setStage('read');
      setConfetti(true);
    });
    tapHaptic(30);
  }, [clearTimers]);

  useEffect(() => {
    if (!open) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage('read');
      return undefined;
    }
    // The first beat leaves time for the envelope to fly in from the /home
    // card (support/SupportThanks.jsx).
    timers.current = [
      setTimeout(() => setStage('opening'), 550),
      setTimeout(() => setStage('peek'), 1100),
      setTimeout(takeOut, 1950),
    ];
    return clearTimers;
  }, [open, takeOut, clearTimers]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={stage === 'read' ? 'thank-you-title' : undefined}
      aria-label={stage === 'read' ? undefined : 'A thank-you note from Tiago'}
      slotProps={{
        // The envelope and the letter each bring their own shadow, so the
        // Dialog's paper is only a centering box.
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
        transition: {
          onExited: () => {
            setStage('closed');
            setConfetti(false);
          },
        },
      }}
    >
      {stage === 'read' ? (
        <>
          {confetti && <Confetti from={letter} />}
          <Letter ref={letter} type={type} date={date} firstName={firstName} onClose={onClose} />
        </>
      ) : (
        // Room above the envelope for the letter to rise into, so the whole
        // picture stays centered.
        <Box sx={{ pt: '11rem', pb: 3 }}>
          {/* A div, not a <button>: the tucked letter has buttons in it
              (inert, but a button can't hold a button). */}
          <ButtonBase
            component='div'
            onClick={takeOut}
            autoFocus
            aria-label='Open the note'
            sx={{ display: 'block', borderRadius: '4.7% / 7%' }}
          >
            <Envelope
              stage={stage}
              width={ENVELOPE_WIDTH}
              floating
              name='thank'
              letterScale={TUCKED_SCALE}
              letter={<Letter type={type} date={date} firstName={firstName} tucked />}
            />
          </ButtonBase>
        </Box>
      )}
    </Dialog>
  );
}
