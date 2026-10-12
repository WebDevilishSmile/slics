import theme from '@/theme';
import {
  ChatBubbleOutline,
  ContentCopy,
  DirectionsOutlined,
  PhoneOutlined,
  PictureAsPdfOutlined,
  PlaceOutlined,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

import PinnedControl from '@/components/help/PinnedControl';

import {
  softContainedSx,
  softInset,
  softRaisedSmall,
  softRaisedTight,
} from '@/components/utility/soft';

// The card's controls, in pin order, each with the guide that explains it
// (guides.jsx `screen`). The numbers match the "On this card" list on /help.
export const CARD_CONTROLS = [
  { key: 'navigate', label: 'Navigate', guide: 'navigate' },
  { key: 'call', label: 'Call', guide: 'call' },
  { key: 'copy', label: 'Copy', guide: 'copy' },
  { key: 'pdf', label: 'PDF', guide: 'pdf' },
  { key: 'tips', label: 'Tips', guide: 'read-tips' },
];

const pinNumber = Object.fromEntries(CARD_CONTROLS.map((c, i) => [c.key, i + 1]));

// The lit control in a guide's picture: ringed in brand blue. Everything
// around it dims to `DIM`.
export const DIM = 0.32;
export const litSx = {
  outline: `2px solid ${theme.vars.palette.primary.main}`,
  outlineOffset: '3px',
};

// The "Tap" call-out on the lit control in a guide's replica, the way an
// instruction booklet marks the new piece.
export function TapFlag({ sx }) {
  return (
    <Box
      component='span'
      aria-hidden='true'
      sx={[
        {
          position: 'absolute',
          top: '-0.75rem',
          right: '0.75rem',
          px: 1,
          borderRadius: 99,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          typography: 'caption',
          fontWeight: 800,
          letterSpacing: '0.04em',
          boxShadow: `0 0 0 3px ${theme.vars.palette.background.default}`,
          zIndex: 1,
        },
        sx,
      ]}
    >
      TAP
    </Box>
  );
}

// A made-up SLIC card in the /home card's look (never a real SLIC; keep it in
// step with home/TitleAddress.jsx and home/SlicActions.jsx, as
// landing/ProductPreview.jsx is). Two uses:
// - `pins`: the index at the top of /help. Each control is a link to its
//   guide, carrying its number (PinnedControl.jsx, which pops the pin on a
//   tap).
// - `focus='call'` (etc.): a guide's picture. Everything but that control is
//   dimmed, and the control is ringed in blue with a TAP flag.
export default function ExampleSlicCard({ pins = false, focus = null }) {
  // A control, for both uses: a pinned link, or part of a guide's picture.
  const render = (key, sx, content) => {
    const lit = focus === key;
    const dim = focus && !lit;
    const { label, guide } = CARD_CONTROLS.find((c) => c.key === key);
    const controlSx = [
      {
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit',
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.short,
          easing: theme.transitions.easing.out,
        }),
        opacity: dim ? DIM : 1,
        ...(lit && litSx),
        ...(pins && { '&:active': { transform: 'scale(0.97)' } }),
      },
      // sx arrays don't nest, so a helper's array is spread in.
      ...(Array.isArray(sx) ? sx : [sx]),
    ];
    if (pins) {
      return (
        <PinnedControl
          href={`#${guide}`}
          label={`${pinNumber[key]}: how to use ${label}`}
          n={pinNumber[key]}
          sx={controlSx}
        >
          {content}
        </PinnedControl>
      );
    }
    return (
      <Box sx={controlSx}>
        {lit && <TapFlag />}
        {content}
      </Box>
    );
  };

  const tile = (key, Icon, label) =>
    render(
      key,
      [
        softRaisedSmall(theme),
        {
          flex: 1,
          minHeight: '3.5rem',
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.25,
          color: 'primary.main',
          typography: 'body2',
          fontWeight: 700,
        },
      ],
      <>
        <Icon fontSize='small' aria-hidden='true' />
        {label}
      </>,
    );

  return (
    <Box
      role={pins ? undefined : 'img'}
      aria-label={pins ? undefined : `The SLIC card, with ${CARD_CONTROLS.find((c) => c.key === focus)?.label} highlighted`}
      sx={[
        pins ? softRaisedTight(theme) : {},
        { position: 'relative', width: '100%', borderRadius: 5, p: pins ? 2.5 : 0 },
      ]}
    >
      {pins && (
        <Box
          component='span'
          sx={[
            softRaisedSmall(theme),
            {
              position: 'absolute',
              top: '-0.7rem',
              right: '1rem',
              px: 1.25,
              borderRadius: 99,
              typography: 'caption',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'text.secondary',
            },
          ]}
        >
          EXAMPLE
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', opacity: focus ? DIM : 1 }}>
        <Box>
          <Typography component='p' sx={{ typography: 'h5', fontWeight: 800, letterSpacing: '-0.01em' }}>
            OAKHB
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            SLIC 1234 · Oakdale Hub
          </Typography>
        </Box>
        <Box
          component='span'
          sx={[softRaisedSmall(theme), { px: 1.25, py: 0.25, borderRadius: 99, typography: 'caption', fontWeight: 700 }]}
        >
          Center
        </Box>
      </Box>

      {render(
        'copy',
        [softInset(theme), { mt: pins ? 2.25 : 1.5, p: 1.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.25 }],
        <>
          <PlaceOutlined sx={{ color: 'primary.main' }} aria-hidden='true' />
          <Typography component='span' variant='body2' sx={{ flex: 1 }}>
            100 Example Road
            <br />
            Oakdale, PA 15071
          </Typography>
          <ContentCopy fontSize='small' sx={{ color: 'primary.main' }} aria-hidden='true' />
        </>,
      )}

      {render(
        'navigate',
        [
          softContainedSx(theme),
          {
            mt: pins ? 2.25 : 1.5,
            minHeight: '3rem',
            px: 2,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 700,
          },
        ],
        <>
          <DirectionsOutlined fontSize='small' aria-hidden='true' />
          Navigate
          <Box component='span' sx={{ ml: 'auto', typography: 'caption', opacity: 0.85 }}>
            Google Maps
          </Box>
        </>,
      )}

      <Box sx={{ display: 'flex', gap: 1.5, mt: pins ? 2.25 : 1.5 }}>
        {tile('call', PhoneOutlined, 'Call')}
        {tile('pdf', PictureAsPdfOutlined, 'PDF')}
        {tile('tips', ChatBubbleOutline, 'Tips')}
      </Box>
    </Box>
  );
}
