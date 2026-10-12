import theme from '@/theme';
import {
  ChatBubbleOutline,
  HelpOutline,
  HubOutlined,
  MenuOutlined,
  PersonOutline,
  PhoneOutlined,
  PictureAsPdfOutlined,
  PinDropOutlined,
  SearchOutlined,
  SignpostOutlined,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

import { DIM, TapFlag, litSx } from '@/components/help/ExampleSlicCard';
import SlicsMark from '@/components/utility/SlicsMark';
import { softInset, softRaisedSmall } from '@/components/utility/soft';

// Pictures for the guides whose control isn't on the SLIC card, drawn the
// same way as ExampleSlicCard's `focus` pictures: the screen dimmed, the
// control the guide is about ringed in blue with a TAP flag. Simplified
// copies of the real controls; keep the labels in step with them
// (home/SlicsSearch.jsx, comments/, home/ReportSlic.jsx, header/UserMenu.jsx).

function Lit({ children, sx, flagSx }) {
  return (
    <Box sx={[{ position: 'relative' }, litSx, ...(Array.isArray(sx) ? sx : [sx])]}>
      <TapFlag sx={flagSx} />
      {children}
    </Box>
  );
}

const rowSx = { display: 'flex', alignItems: 'center', gap: 1.25 };

// The search bar, with a Recent row under it.
function SearchScreen() {
  return (
    <>
      <Lit sx={[softInset(theme), rowSx, { minHeight: '3rem', px: 2, borderRadius: 99 }]}>
        <SearchOutlined sx={{ color: 'primary.main' }} aria-hidden='true' />
        <Typography component='span' color='text.secondary'>
          SLIC, code or name
        </Typography>
      </Lit>
      <Box sx={{ opacity: DIM, mt: 2, px: 1 }}>
        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
          Recent
        </Typography>
        <Box sx={[rowSx, { mt: 0.5 }]}>
          <Typography component='span' sx={{ fontWeight: 700 }}>
            OAKHB
          </Typography>
          <Typography component='span' variant='body2' color='text.secondary'>
            1234 · Oakdale Hub
          </Typography>
        </Box>
      </Box>
    </>
  );
}

// The tip box: topic chips, the text box, Add pin and Post tip.
function TipComposerScreen() {
  return (
    <>
      <Box sx={{ opacity: DIM }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['Parking', 'Gate / guard'].map((topic) => (
            <Box
              key={topic}
              component='span'
              sx={[softRaisedSmall(theme), { px: 1.5, py: 0.5, borderRadius: 99, typography: 'body2', fontWeight: 600 }]}
            >
              {topic}
            </Box>
          ))}
        </Box>
        <Box sx={[softInset(theme), { mt: 1.5, p: 1.5, minHeight: '4rem', borderRadius: 3 }]}>
          <Typography variant='body2' color='text.secondary'>
            Gate code changed, use the north entrance.
          </Typography>
        </Box>
      </Box>
      <Box sx={[rowSx, { mt: 2, justifyContent: 'space-between' }]}>
        <Box sx={[rowSx, { opacity: DIM, color: 'primary.main', typography: 'body2', fontWeight: 700 }]}>
          <PinDropOutlined fontSize='small' aria-hidden='true' />
          Add pin
        </Box>
        <Lit
          sx={{
            px: 2.5,
            minHeight: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 99,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 700,
          }}
        >
          Post tip
        </Lit>
      </Box>
    </>
  );
}

// The bottom of the SLIC card, with the report link under it.
function ReportScreen() {
  return (
    <>
      <Box sx={{ display: 'flex', gap: 1.5, opacity: DIM }}>
        {[
          [PhoneOutlined, 'Call'],
          [PictureAsPdfOutlined, 'PDF'],
          [ChatBubbleOutline, 'Tips'],
        ].map(([Icon, label]) => (
          <Box
            key={label}
            sx={[
              softRaisedSmall(theme),
              {
                flex: 1,
                minHeight: '3.5rem',
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                typography: 'body2',
                fontWeight: 700,
              },
            ]}
          >
            <Icon fontSize='small' aria-hidden='true' />
            {label}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
        <Lit sx={{ px: 1, py: 0.75, borderRadius: 2, color: 'primary.main', typography: 'body2', fontWeight: 600, textDecoration: 'underline' }}>
          Something wrong with this SLIC?
        </Lit>
      </Box>
    </>
  );
}

// The blue header as /home shows it (the menu button left, the S mark
// right; header/HeaderBar.jsx) with the menu button lit, and the menu's rows
// under it with their icons (header/UserMenu.jsx). On the blue bar the ring
// is white and the TAP flag sits to the button's right, inverted.
const MENU_ROWS = [
  [SearchOutlined, 'Look up a SLIC'],
  [HubOutlined, 'All Hubs'],
  [SignpostOutlined, 'Places'],
  [PersonOutline, 'Profile'],
  [HelpOutline, 'Help'],
];

function MenuScreen() {
  return (
    <>
      <Box
        sx={[
          rowSx,
          {
            minHeight: '3.5rem',
            px: 1,
            borderRadius: '12px 12px 4px 4px',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          },
        ]}
      >
        <Lit
          sx={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outlineColor: 'currentColor',
          }}
          flagSx={{
            top: '50%',
            right: 'auto',
            left: 'calc(100% + 0.75rem)',
            transform: 'translateY(-50%)',
            bgcolor: 'background.default',
            color: 'primary.main',
            boxShadow: 'none',
          }}
        >
          <MenuOutlined aria-hidden='true' />
        </Lit>
        <SlicsMark sx={{ ml: 'auto', mr: 1, fontSize: '1.75rem', color: 'text.light', opacity: 0.55 }} />
      </Box>
      <Box component='ul' sx={{ listStyle: 'none', m: 0, mt: 1.5, p: 0, opacity: DIM }}>
        {MENU_ROWS.map(([Icon, item]) => (
          <Typography component='li' key={item} sx={[rowSx, { gap: 2, py: 0.75, px: 1, fontWeight: 600 }]}>
            <Icon fontSize='small' sx={{ color: 'primary.main' }} aria-hidden='true' />
            {item}
          </Typography>
        ))}
      </Box>
    </>
  );
}

const SCREENS = {
  menu: { Screen: MenuScreen, label: 'The header, with the menu button highlighted' },
  search: { Screen: SearchScreen, label: 'The search bar, highlighted' },
  'post-tip': { Screen: TipComposerScreen, label: 'The tip box, with Post tip highlighted' },
  report: { Screen: ReportScreen, label: 'The “Something wrong with this SLIC?” link, highlighted' },
};

export const HELP_SCREEN_KEYS = Object.keys(SCREENS);

export default function HelpScreen({ screen }) {
  const { Screen, label } = SCREENS[screen];
  return (
    <Box role='img' aria-label={label}>
      <Screen />
    </Box>
  );
}
