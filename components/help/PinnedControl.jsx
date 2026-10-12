'use client';

import theme from '@/theme';
import { Box } from '@mui/material';
import { tapHaptic } from '@/lib/haptics';

// The numbered pin on a control: a solid blue disc ringed in the surface so
// it reads as sitting on top of the card.
const pinSx = {
  position: 'absolute',
  top: '-0.6rem',
  left: '-0.6rem',
  width: '1.625rem',
  height: '1.625rem',
  borderRadius: '50%',
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  typography: 'caption',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `0 0 0 3px ${theme.vars.palette.background.default}`,
  zIndex: 1,
};

// A control on /help's pinned example card (ExampleSlicCard.jsx `pins`): a
// link to its guide carrying pin number `n`. While it's pressed the pin
// shrinks, and on release it springs back (`.help-pin`, globals.css): CSS
// `:active`, which a phone drops once a touch turns into a scroll, so scrolling
// across the card doesn't spring the pins. Activating it gives a short haptic
// tap (Android), keyboard included. It's a client component only for that.
export default function PinnedControl({ href, label, n, sx, children }) {
  return (
    <Box
      component='a'
      href={href}
      aria-label={label}
      onClick={() => tapHaptic()}
      sx={sx}
    >
      <Box component='span' aria-hidden='true' className='help-pin' sx={pinSx}>
        {n}
      </Box>
      {children}
    </Box>
  );
}
