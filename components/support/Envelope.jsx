'use client';

import { useId } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/material/styles';

// The note envelope (the thank-you, docs/BMC-SUPPORT.md stage 3, and the
// welcome note, docs/STAFF-ROLES.md): brand-blue paper, shaded as if lit from
// the top left, shut with an amber wax seal with an icon pressed into it
// (`seal`, a 24px icon path: the coffee cup unless told otherwise). `stage`
// drives it:
//   closed  – sealed; `wiggle` gives it a small nudge every few seconds
//   opening – the seal comes away and the flap swings up toward the viewer
//   peek    – the flap has gone behind the letter, which slides most of the
//             way out
// `letter` is what's tucked inside, drawn at `letterScale`; the note passes
// the letter itself, so the one that comes out is the one that opens
// (support/ThankYouNote.jsx). `name` sets the View Transition names the note
// morphs with: `<name>-envelope` on the envelope, plus `<name>-pocket` and
// `<name>-letter` while it peeks. The front pocket is named apart from the rest
// so it stays in front of the letter as the envelope drops away. Only
// transform and opacity animate. The SVGs stretch to the box
// (preserveAspectRatio none), which keeps the 3:2 shape at any width.

const wiggle = keyframes`
  0%, 70%, 100% { rotate: 0deg; }
  76% { rotate: -6deg; }
  82% { rotate: 5deg; }
  88% { rotate: -3deg; }
  94% { rotate: 2deg; }
`;

const fill = (token) => ({ fill: `var(--mui-palette-${token})` });

// A blob of wax: a circle with a few soft, uneven lobes.
const WAX =
  'M96.9 50C97.5 52.7 98.3 55.8 97.7 58.4C97.2 61.1 95.2 63.6 93.6 65.9C92 68.1 89.7 69.9 88.2 72.1C86.8 74.3 86 76.8 84.7 79.1C83.3 81.4 82 84.1 80 85.8C78 87.5 75.1 88.3 72.7 89.3C70.2 90.2 67.6 90.5 65.2 91.6C62.7 92.7 60.6 94.7 58.1 95.8C55.6 97 52.7 98.4 50 98.5C47.3 98.5 44.4 97.2 41.9 96.1C39.3 95.1 37.1 93.2 34.7 92.1C32.2 91 29.6 90.7 27.1 89.6C24.6 88.6 21.8 87.7 19.9 85.9C17.9 84.1 16.8 81.3 15.5 79C14.2 76.6 13.6 74.1 12.1 71.9C10.7 69.7 8.4 68 6.9 65.7C5.3 63.5 3.2 61 2.6 58.4C2 55.7 2.6 52.7 3.1 50C3.6 47.3 4.9 44.8 5.5 42.1C6 39.5 5.8 36.8 6.4 34.1C7 31.5 7.5 28.5 9 26.3C10.5 24.1 13.2 22.5 15.3 20.9C17.5 19.3 20.1 18.4 22.1 16.7C24.1 15 25.4 12.6 27.3 10.7C29.3 8.8 31.3 6.4 33.7 5.3C36.2 4.3 39.2 4.3 41.9 4.2C44.6 4.1 47.3 4.8 50 4.7C52.7 4.7 55.4 3.8 58.1 3.9C60.9 3.9 64 3.8 66.4 4.9C68.9 6 70.9 8.4 72.9 10.4C74.8 12.3 76.1 14.8 78.1 16.6C80 18.3 82.4 19.4 84.5 21C86.6 22.7 89.2 24.3 90.7 26.5C92.1 28.7 92.5 31.7 93.1 34.3C93.7 36.9 93.6 39.6 94.2 42.2C94.9 44.8 96.3 47.3 96.9 50Z';

// Icon paths (@mui/icons-material) to press into the wax: LocalCafe for the
// thank-you, Key for the welcome note.
export const CUP = 'M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2m0 5h-2V5h2zM4 19h16v2H4z';
export const KEY = 'M21 10h-8.35C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H13l2 2 2-2 2 2 4-4.04zM7 15c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3';

// The seal: a domed blob of amber wax with a ring and the icon stamped into
// it. Each pressed shape is drawn twice, a pale copy a hair lower first, so
// light catches the lower lip of the groove the way it does on real wax.
function WaxSeal({ icon }) {
  // Unique per envelope (the /home card and the note can both be on screen),
  // and plain enough for a url(#…) reference.
  const dome = `wax${useId().replace(/[^\w-]/g, '')}`;
  const stop = (token) => ({ stopColor: `var(--mui-palette-warning-${token})` });
  return (
    <Box component='svg' viewBox='0 0 100 100' sx={{ display: 'block', width: 1, height: 1, overflow: 'visible' }}>
      <defs>
        <radialGradient id={dome} cx='38%' cy='32%' r='75%'>
          <stop offset='0' style={stop('light')} />
          <stop offset='0.55' style={stop('main')} />
          <stop offset='1' style={stop('dark')} />
        </radialGradient>
      </defs>
      <path d={WAX} fill={`url(#${dome})`} />
      <circle cx='50' cy='51.2' r='33' fill='none' stroke='#fff' strokeOpacity='0.35' strokeWidth='2' />
      <circle cx='50' cy='50' r='33' fill='none' style={{ stroke: 'var(--mui-palette-warning-dark)' }} strokeWidth='2.5' />
      <g transform='translate(31 31) scale(1.583)'>
        <path d={icon} fill='#fff' fillOpacity='0.4' transform='translate(0 0.7)' />
        <path d={icon} style={fill('warning-dark')} />
      </g>
    </Box>
  );
}

// Light and shade over the paper, lit from the top left like the app's soft
// shadows: a gradient of white or black, as [offset, color, opacity] stops,
// from (0, 0) to (x2, y2) of the shape it fills.
function Shade({ id, x1 = 0, y1 = 0, x2 = 1, y2 = 1, stops }) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      {stops.map(([offset, color, opacity]) => (
        <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
      ))}
    </linearGradient>
  );
}

// A paper edge catching the light (white) or turned from it (black): a 1px
// line however far the SVG stretches.
const edge = (color, opacity) => ({
  fill: 'none',
  stroke: color,
  strokeOpacity: opacity,
  strokeWidth: 1,
  vectorEffect: 'non-scaling-stroke',
});

export default function Envelope({
  stage = 'closed',
  width = '20rem',
  wiggle: shouldWiggle = false,
  floating = false,
  letter,
  letterScale = 1,
  name,
  seal = CUP,
}) {
  const opened = stage !== 'closed';
  const peek = stage === 'peek';
  // Gradient ids, unique per envelope like the seal's.
  const uid = `env${useId().replace(/[^\w-]/g, '')}`;
  const url = (part) => `url(#${uid}${part})`;

  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        position: 'relative',
        width,
        aspectRatio: '3 / 2',
        flexShrink: 0,
        perspective: '60rem',
        borderRadius: '4.7% / 7%',
        viewTransitionName: name ? `${name}-envelope` : undefined,
        animation: shouldWiggle ? `${wiggle} 4.5s var(--ease-out) 1.5s infinite` : undefined,
        // Over the dialog's backdrop it floats like the letter does.
        ...(floating && {
          boxShadow: theme.soft.overlay.light,
          ...theme.applyStyles('dark', { boxShadow: theme.soft.overlay.dark }),
        }),
      })}
    >
      {/* The inside of the back, seen once the flap is up: in shadow toward
          the top, where the pocket's mouth opens. */}
      <Box component='svg' viewBox='0 0 300 200' preserveAspectRatio='none' sx={{ position: 'absolute', inset: 0, width: 1, height: 1 }}>
        <defs>
          <Shade id={`${uid}back`} x2={0} stops={[[0, '#000', 0.3], [0.55, '#000', 0]]} />
        </defs>
        <rect width='300' height='200' rx='14' style={fill('primary-dark')} />
        <rect width='300' height='200' rx='14' fill={url('back')} />
      </Box>

      {/* The flap: hinged at the top, it swings up (toward the viewer) and
          then sits behind the letter. Its color darkens as it turns, so the
          inside face reads as the inside. Shut, it casts a faint shadow on
          the pocket. */}
      <Box
        sx={{
          position: 'absolute',
          insetInline: 0,
          top: 0,
          height: '60%',
          transformOrigin: 'top center',
          rotate: opened ? 'x 180deg' : 'x 0deg',
          zIndex: peek ? 1 : 4,
          filter: opened ? 'none' : 'drop-shadow(0 2px 2px rgb(0 0 0 / 0.18))',
          transition: 'rotate 500ms var(--ease-out)',
        }}
      >
        <Box component='svg' viewBox='0 0 300 120' preserveAspectRatio='none' sx={{ width: 1, height: 1, overflow: 'visible' }}>
          <defs>
            <Shade id={`${uid}flap`} stops={[[0, '#fff', 0.18], [0.6, '#fff', 0], [1, '#000', 0.08]]} />
          </defs>
          <path
            d='M10 0 L290 0 Q300 0 293 7 L162 110 Q150 120 138 110 L7 7 Q0 0 10 0 Z'
            style={{
              fill: `var(--mui-palette-primary-${opened ? 'dark' : 'light'})`,
              transition: 'fill 500ms var(--ease-out)',
            }}
          />
          <path d='M10 0 L290 0 Q300 0 293 7 L162 110 Q150 120 138 110 L7 7 Q0 0 10 0 Z' fill={url('flap')} />
        </Box>
      </Box>

      {/* The letter, tucked in. The clip hides whatever hangs below the
          envelope and leaves it free to rise out of the top; it slides out
          on a spring. By the time it peeks, all of it is above the bottom
          edge, so nothing pops into view when the note morphs it. */}
      {letter && (
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, clipPath: 'inset(-400% -20% 0 -20%)' }}>
          <Box
            inert
            sx={{
              position: 'absolute',
              top: '7%',
              left: '50%',
              transformOrigin: 'top center',
              scale: String(letterScale),
              // Hidden while sealed: a sliver would show beside the flap's edges.
              visibility: opened ? 'visible' : 'hidden',
              translate: peek ? '-50% -42%' : '-50% 0',
              transition: 'translate 650ms var(--ease-spring)',
              viewTransitionName: name && peek ? `${name}-letter` : undefined,
            }}
          >
            {letter}
          </Box>
        </Box>
      )}

      {/* The front pocket: two side folds, the left one toward the light, and
          a lighter bottom fold over them. Its edges catch the light on the
          left and fall into shade on the right, and the mouth's edge shows
          once the flap is up. */}
      <Box
        component='svg'
        viewBox='0 0 300 200'
        preserveAspectRatio='none'
        sx={{
          position: 'absolute',
          inset: 0,
          width: 1,
          height: 1,
          zIndex: 3,
          viewTransitionName: name && peek ? `${name}-pocket` : undefined,
        }}
      >
        <defs>
          <Shade id={`${uid}sides`} y2={0} stops={[[0, '#fff', 0.12], [0.5, '#fff', 0], [1, '#000', 0.12]]} />
          <Shade id={`${uid}fold`} x1={0.3} x2={0.7} stops={[[0, '#fff', 0.22], [1, '#fff', 0.05]]} />
        </defs>
        <path d='M0 6 L150 112 L300 6 L300 186 Q300 200 286 200 L14 200 Q0 200 0 186 Z' style={fill('primary-main')} />
        <path d='M0 6 L150 112 L300 6 L300 186 Q300 200 286 200 L14 200 Q0 200 0 186 Z' fill={url('sides')} />
        <path d='M0 6 L150 112 L300 6' style={edge('#fff', 0.3)} />
        <path d='M14 200 Q3 200 9 192 L150 96 L291 192 Q297 200 286 200 Z' style={fill('primary-main')} />
        <path d='M14 200 Q3 200 9 192 L150 96 L291 192 Q297 200 286 200 Z' fill={url('fold')} />
        <path d='M9 192 L150 96' style={edge('#fff', 0.35)} />
        <path d='M150 96 L291 192' style={edge('#000', 0.18)} />
      </Box>

      {/* The seal, where the flap's tip meets the pocket. Opening, it lifts
          away: a little larger, then gone. */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '58%',
          width: '22%',
          aspectRatio: '1',
          zIndex: 5,
          translate: '-50% -50%',
          filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.3))',
          scale: opened ? '1.2' : '1',
          opacity: opened ? 0 : 1,
          transition: 'scale 220ms var(--ease-out), opacity 220ms var(--ease-out)',
        }}
      >
        <WaxSeal icon={seal} />
      </Box>
    </Box>
  );
}
