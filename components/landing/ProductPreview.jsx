import theme from '@/theme';
import {
  ChatBubbleOutline,
  DirectionsOutlined,
  PhoneOutlined,
  PictureAsPdfOutlined,
  PlaceOutlined,
} from '@mui/icons-material';
import { Avatar, Box, Typography } from '@mui/material';
import { softInset, softRaised, softRaisedSmall } from '@/components/utility/soft';

// A picture of the /home lookup card, so `/` shows the app instead of only
// describing it. Static and made up (no real SLIC on a public page): nothing in
// it is focusable, the card is hidden from screen readers, and the caption says
// what it is. It copies the look of home/TitleAddress.jsx, home/SlicActions.jsx
// and a tip from comments/Comment.jsx; keep it in step when those change.

// One of the Call/PDF/Tips tiles under Navigate.
function Tile({ icon: Icon, label }) {
  return (
    <Box
      sx={[
        softRaised(theme),
        {
          flex: 1,
          minHeight: '3.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          borderRadius: 4,
          color: 'primary.main',
          typography: 'button',
          textTransform: 'none', // like the theme's buttons; the variant uppercases
        },
      ]}
    >
      <Icon />
      {label}
    </Box>
  );
}

export default function ProductPreview({ signedIn }) {
  return (
    <Box
      component='figure'
      sx={{
        m: 0,
        width: '100%',
        maxWidth: theme.layout.width.field,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box
        aria-hidden
        sx={[
          softRaised(theme),
          {
            p: { xs: 2.5, sm: 3 },
            borderRadius: 4,
            textAlign: 'left',
            userSelect: 'none',
          },
        ]}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box>
            <Typography variant='h4' component='p' sx={{ fontWeight: 700 }}>
              OAKHB
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              SLIC 1234 · Oakdale Hub
            </Typography>
          </Box>
          <Box
            sx={[
              softRaisedSmall(theme),
              {
                px: 1.5,
                py: 0.75,
                borderRadius: 999,
                color: 'primary.main',
                typography: 'body2',
                fontWeight: 600,
                letterSpacing: '0.04em',
              },
            ]}
          >
            Center
          </Box>
        </Box>

        <Box
          sx={[
            softInset(theme),
            {
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mt: 2.5,
              p: 2,
              borderRadius: 4,
            },
          ]}
        >
          <PlaceOutlined sx={{ color: 'primary.main' }} />
          <Box>
            <Typography>100 Example Road</Typography>
            <Typography>Oakdale, PA 15071</Typography>
          </Box>
        </Box>

        <Box
          sx={[
            softRaisedSmall(theme),
            {
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 3,
              px: 2.5,
              minHeight: '3.25rem',
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              typography: 'button',
              textTransform: 'none',
            },
          ]}
        >
          <DirectionsOutlined />
          Navigate
          <Box component='span' sx={{ ml: 'auto', typography: 'body2' }}>
            Google Maps
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
          <Tile icon={PhoneOutlined} label='Call' />
          <Tile icon={PictureAsPdfOutlined} label='PDF' />
          <Tile icon={ChatBubbleOutline} label='Tips' />
        </Box>

        {/* A tip, in a well so it isn't a raised card on a raised card. */}
        <Box sx={[softInset(theme), { mt: 2.5, p: 2, borderRadius: 4 }]}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: '2rem',
                height: '2rem',
                bgcolor: 'primary.main',
                typography: 'subtitle2',
              }}
            >
              D
            </Avatar>
            <Box>
              <Typography variant='subtitle2'>Dave</Typography>
              <Typography variant='caption' color='text.secondary'>
                2 days ago
              </Typography>
            </Box>
          </Box>
          <Typography variant='body2' sx={{ mt: 1.5 }}>
            Feeders use the north gate. Check in at the guard shack, then doors
            14–20.
          </Typography>
          <Box
            sx={[
              softRaisedSmall(theme),
              {
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                mt: 1.5,
                px: 1.5,
                minHeight: '2.5rem',
                borderRadius: 1,
                color: 'primary.main',
                typography: 'button',
                textTransform: 'none',
              },
            ]}
          >
            <PlaceOutlined fontSize='small' />
            Pinned spot
          </Box>
        </Box>
      </Box>

      <Typography
        component='figcaption'
        variant='body2'
        color='text.secondary'
        sx={{ textAlign: 'center' }}
      >
        {signedIn
          ? 'An example SLIC card.'
          : 'An example SLIC card. Real ones show once you sign in.'}
      </Typography>
    </Box>
  );
}
