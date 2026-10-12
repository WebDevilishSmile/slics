import theme from '@/theme';
import {
  DirectionsOutlined,
  FlagOutlined,
  ForumOutlined,
  PhoneOutlined,
  PictureAsPdfOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { softInset, softRaised } from '@/components/utility/soft';

// What a signed-in driver can do. Admin-only and not-yet-launched features
// (covers, places) stay off this public page until they open to everyone.
const FEATURES = [
  {
    icon: SearchOutlined,
    title: 'Look up any SLIC',
    text: 'Type the code and get the destination’s name and address, hubs and customers alike.',
  },
  {
    icon: DirectionsOutlined,
    title: 'Navigate in one tap',
    text: 'Open the address in Google Maps, or Apple Maps on an iPhone. No typing it in.',
  },
  {
    icon: PhoneOutlined,
    title: 'Call ahead',
    text: 'Tap the phone number to call the building.',
  },
  {
    icon: ForumOutlined,
    title: 'Driver tips',
    text: 'Read and share what drivers know about a location: where to park, which door, what to watch for. A tip can pin the exact spot on the map.',
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
      sx={{ width: '100%', maxWidth: theme.layout.width.wide, mt: 6 }}
    >
      <Typography variant='sectionHeading' id='features-heading'>
        What you can do
      </Typography>
      <Box
        component='ul'
        sx={{
          listStyle: 'none',
          p: 0,
          m: 0,
          mt: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 3,
        }}
      >
        {FEATURES.map(({ icon: Icon, title, text }, i) => (
          <Box
            component='li'
            key={title}
            className='enter'
            style={{ '--i': i }}
            sx={[
              softRaised(theme),
              {
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
                p: 3,
                borderRadius: 4,
              },
            ]}
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
              <Typography variant='h6' component='h3'>
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
