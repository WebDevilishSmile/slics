'use client';

import { LocalCafe } from '@mui/icons-material';
import { Box } from '@mui/material';
import { keyframes } from '@mui/material/styles';

// The thank-you envelope (docs/BMC-SUPPORT.md stage 3), drawn in brand blue
// with a gold seal. `stage` drives it:
//   closed  – sealed; `wiggle` gives it a small nudge every few seconds
//   opening – the seal pops and the flap swings up toward the viewer
//   peek    – the flap has gone behind the letter, which slides out
// Only transform and opacity animate. The SVGs stretch to the box
// (preserveAspectRatio none), which keeps the 3:2 shape at any width.

const wiggle = keyframes`
  0%, 70%, 100% { rotate: 0deg; }
  76% { rotate: -6deg; }
  82% { rotate: 5deg; }
  88% { rotate: -3deg; }
  94% { rotate: 2deg; }
`;

const fill = (token) => ({ fill: `var(--mui-palette-${token})` });

export default function Envelope({ stage = 'closed', width = '20rem', wiggle: shouldWiggle = false, named = false }) {
  const opened = stage !== 'closed';
  const peek = stage === 'peek';

  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        width,
        maxWidth: '82vw',
        aspectRatio: '3 / 2',
        flexShrink: 0,
        perspective: '60rem',
        viewTransitionName: named && peek ? 'thank-envelope' : undefined,
        animation: shouldWiggle ? `${wiggle} 4.5s var(--ease-out) 1.5s infinite` : undefined,
      }}
    >
      {/* The inside of the back, seen once the flap is up. */}
      <Box component='svg' viewBox='0 0 300 200' preserveAspectRatio='none' sx={{ position: 'absolute', inset: 0, width: 1, height: 1 }}>
        <rect width='300' height='200' rx='14' style={fill('primary-dark')} />
      </Box>

      {/* The flap: hinged at the top, it swings up (toward the viewer) and
          then sits behind the letter. Its color darkens as it turns, so the
          inside face reads as the inside. */}
      <Box
        sx={{
          position: 'absolute',
          insetInline: 0,
          top: 0,
          height: '60%',
          transformOrigin: 'top center',
          rotate: opened ? 'x 180deg' : 'x 0deg',
          zIndex: peek ? 1 : 4,
          transition: 'rotate 550ms var(--ease-out)',
          '& path': {
            transition: 'fill 550ms var(--ease-out)',
            fill: opened ? 'var(--mui-palette-primary-dark)' : 'var(--mui-palette-primary-light)',
          },
        }}
      >
        <Box component='svg' viewBox='0 0 300 120' preserveAspectRatio='none' sx={{ width: 1, height: 1, overflow: 'visible' }}>
          <path d='M10 0 L290 0 Q300 0 293 7 L162 110 Q150 120 138 110 L7 7 Q0 0 10 0 Z' />
        </Box>
      </Box>

      {/* The letter, tucked in. It slides out on a spring. */}
      <Box
        sx={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          top: '7%',
          height: '86%',
          zIndex: 2,
          borderRadius: '6%/ 9%',
          bgcolor: 'background.default',
          p: '7% 9%',
          display: 'flex',
          flexDirection: 'column',
          gap: '9%',
          // Hidden while sealed: a sliver would show beside the flap's edges.
          visibility: opened ? 'visible' : 'hidden',
          translate: peek ? '0 -48%' : '0 0',
          transition: 'translate 650ms var(--ease-spring)',
          viewTransitionName: named && peek ? 'thank-letter' : undefined,
        }}
      >
        {[60, 90, 80, 45].map((w, i) => (
          <Box key={i} sx={{ height: '7%', width: `${w}%`, borderRadius: 9, bgcolor: 'divider' }} />
        ))}
      </Box>

      {/* The front pocket: two side folds and a lighter bottom fold. */}
      <Box component='svg' viewBox='0 0 300 200' preserveAspectRatio='none' sx={{ position: 'absolute', inset: 0, width: 1, height: 1, zIndex: 3 }}>
        <path d='M0 6 L150 112 L300 6 L300 186 Q300 200 286 200 L14 200 Q0 200 0 186 Z' style={fill('primary-main')} />
        <path d='M14 200 Q3 200 9 192 L150 96 L291 192 Q297 200 286 200 Z' style={fill('primary-main')} />
        <path d='M14 200 Q3 200 9 192 L150 96 L291 192 Q297 200 286 200 Z' fill='#fff' fillOpacity='0.1' />
      </Box>

      {/* The seal, where the flap's tip meets the pocket. */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '58%',
          width: '19%',
          aspectRatio: '1',
          zIndex: 5,
          translate: '-50% -50%',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'warning.main',
          color: 'warning.contrastText',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25), inset 0 0 0 3px rgba(255, 255, 255, 0.25)',
          scale: opened ? '0' : '1',
          opacity: opened ? 0 : 1,
          transition: 'scale 250ms var(--ease-out), opacity 250ms var(--ease-out)',
        }}
      >
        <LocalCafe sx={{ width: '55%', height: '55%' }} />
      </Box>
    </Box>
  );
}
