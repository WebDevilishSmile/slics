import theme from '@/theme';
import {
  DirectionsOutlined,
  FlagOutlined,
  ForumOutlined,
  PictureAsPdfOutlined,
  SignpostOutlined,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { softInset } from '@/components/utility/soft';

// What the example card in the Hero doesn't already show. Admin-only and
// not-yet-launched features (covers) stay off this public page until they
// open to everyone. A plain list on the page surface, not a card each: the
// Hero's card is the raised moment, and the two sections below are cards.
const FEATURES = [
  {
    icon: ForumOutlined,
    title: 'Tips from drivers',
    text: 'Read and share what drivers know about a location: where to park, which door, what to watch for. A tip can pin the exact spot on the map.',
  },
  {
    // The menu's icon for Places (header/UserMenu.jsx).
    icon: SignpostOutlined,
    title: 'Places on your run',
    text: 'Fuel, food, restrooms and truck parking that drivers have found, and whether a trailer fits. Add the spots you know.',
  },
  {
    icon: DirectionsOutlined,
    title: 'Your maps app',
    text: 'Navigate opens Google Maps, or Apple Maps on an iPhone. No typing the address in.',
  },
  {
    icon: PictureAsPdfOutlined,
    title: 'Directions PDFs',
    text: 'Open the printed directions for the SLICs that have them.',
  },
  {
    icon: FlagOutlined,
    title: 'Report a problem',
    text: 'Something wrong with a SLIC? Tell us from its card and it gets fixed.',
  },
];

export default function Features() {
  return (
    <Box
      component='section'
      aria-labelledby='features-heading'
      sx={{ width: '100%', maxWidth: theme.layout.width.wide, mt: 8 }}
    >
      <Typography
        variant='h5'
        component='h2'
        id='features-heading'
        sx={{ textAlign: 'center', mb: 3 }}
      >
        What you can do
      </Typography>
      <Box
        component='ul'
        sx={{
          listStyle: 'none',
          p: 0,
          m: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          columnGap: 4,
          rowGap: 3,
        }}
      >
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <Box
            component='li'
            key={title}
            sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}
          >
            <Box
              sx={[
                softInset(theme),
                {
                  flexShrink: 0,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.main',
                },
              ]}
            >
              <Icon aria-hidden />
            </Box>
            <Box>
              <Typography
                variant='subtitle1'
                component='h3'
                sx={{ fontWeight: 700 }}
              >
                {title}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {text}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
