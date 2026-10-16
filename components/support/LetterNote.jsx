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

// The signature's handwriting. Only the notes use it, so it isn't preloaded;
// the tucked letter starts the download while the envelope is still shut.
const script = Caveat({ subsets: ['latin'], preload: false, display: 'swap' });

// The note's width: a phone's width less the dialog's margins, up to 24rem.
// The envelope is a little narrower, and the letter tucked inside it is drawn
// at 84% of the envelope's width (0.86 × 0.84 ≈ 0.72), so it's the same
// letter, smaller, at any screen width.
const LETTER_WIDTH = 'min(24rem, calc(100vw - 2rem))';
const ENVELOPE_WIDTH = `calc(${LETTER_WIDTH} * 0.86)`;
const TUCKED_SCALE = 0.72;

// The day the letter is dated, the way a letter is: "October 10, 2026", in
// the reader's own time zone. Nothing for a missing or unreadable date.
function letterDate(iso) {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// The signature writes itself once the letter is out: a soft-edged mask
// sweeps left to right across it, like ink going down. The letterhead waits
// for it before it plays (HEART_ONCE and DOT_ONCE in
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

// The letter: stationery with the mark's story embossed at the top, the date,
// the words, and Tiago's signature, after which the letterhead plays.
// `tucked` is the copy inside the envelope: the same letter, unsigned, its
// letterhead on its first frame, with nothing focusable or labelled.
function Letter({ ref, note, onClose, tucked = false }) {
  const { name, story, date, title, paragraphs, closing, action } = note;
  const dated = letterDate(date);
  const buttonSx = { minHeight: '3rem', px: 3 };

  // The main action takes focus as the letter opens. Not with autoFocus:
  // React only honors it on form controls, and a main action can be a link.
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
        viewTransitionName: tucked ? undefined : `${name}-letter`,
      })}
    >
      {/* The letterhead: the mark's story pressed up out of the paper, which
          plays once Tiago has signed. The tucked copy holds its first frame,
          so the letter that comes out starts the way it went in. */}
      <AnimatedSlicsMark
        story={story}
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
        id={tucked ? undefined : `${name}-title`}
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
        {closing}
      </Typography>
      <Signature tucked={tucked} />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
        {action ? (
          <>
            <Button onClick={onClose} sx={[softRaisedSmall, softPressSx, buttonSx]}>
              Close
            </Button>
            <Button
              ref={primary}
              variant='contained'
              href={action.href}
              onClick={onClose}
              sx={[softContainedSx, buttonSx]}
            >
              {action.label}
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

// A note from Tiago in an envelope: the thank-you (support/ThankYouNote.jsx)
// and the welcome note (staff/WelcomeNote.jsx). Opening it plays the
// envelope: the wax seal lifts away, the flap swings up, the letter slides
// most of the way out, then comes to the reader as the envelope drops away (a
// View Transition morph) while confetti bursts behind it, then Tiago signs it
// and last the letterhead plays. Tapping the envelope skips ahead to the
// letter. Under reduced motion it opens straight to the signed letter, under
// the mark, with no confetti. `onClose` runs on Close (or the main action),
// Escape or a tap outside. The note:
//   name       its View Transition names and ids (`<name>-envelope`,
//              `<name>-letter`…, styled in app/globals.css), so two notes can
//              share a page
//   label      what the dialog is called while the envelope is shut
//   story      the letterhead (AnimatedSlicsMark), `seal` the wax's icon
//   date       the day it's dated (ISO)
//   title, paragraphs, closing   the words, closing above the signature
//   action     optional { href, label }: a link as the main action, with Close
//              beside it
export default function LetterNote({ open, onClose, seal, label, ...note }) {
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
    // card (support/NoteCard.jsx).
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
      aria-labelledby={stage === 'read' ? `${note.name}-title` : undefined}
      aria-label={stage === 'read' ? undefined : label}
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
          <Letter ref={letter} note={note} onClose={onClose} />
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
              name={note.name}
              seal={seal}
              letterScale={TUCKED_SCALE}
              letter={<Letter note={note} tucked />}
            />
          </ButtonBase>
        </Box>
      )}
    </Dialog>
  );
}
