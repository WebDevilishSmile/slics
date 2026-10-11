import theme from '@/theme';
import { LightbulbOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

import { softInset, softRaised, softRaisedSmall } from '@/components/utility/soft';

// The guide's icon in a round inset well, as on the About cards.
const iconWellSx = [
  softInset(theme),
  {
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'primary.main',
  },
];

// A step's number in a small raised disc.
const numberSx = [
  softRaisedSmall(theme),
  {
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'primary.main',
    fontWeight: 700,
  },
];

// One how-to guide on /help (guides.jsx): a soft raised card with a title, an
// optional intro, numbered steps, and "Good to know" notes in an inset well.
// The card's `id` is its anchor; scrollMarginTop keeps the title clear of the
// fixed header when a link jumps to it.
export default function HelpGuide({ guide, index = 0 }) {
  const { id, title, icon: Icon, intro, steps, notes } = guide;

  return (
    <Box
      component='article'
      id={id}
      aria-labelledby={`${id}-title`}
      className='enter'
      style={{ '--i': index }}
      sx={[
        softRaised(theme),
        {
          width: '100%',
          maxWidth: theme.layout.width.prose,
          px: { xs: 2.5, sm: 4 },
          py: 3,
          borderRadius: 4,
          scrollMarginTop: '6rem',
        },
      ]}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={iconWellSx}>
          <Icon />
        </Box>
        <Typography id={`${id}-title`} variant='h5' component='h3' sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>

      {intro && (
        <Typography color='text.secondary' sx={{ mt: 2 }}>
          {intro}
        </Typography>
      )}

      <Box
        component='ol'
        sx={{ listStyle: 'none', p: 0, m: 0, mt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        {steps.map((step, stepIndex) => (
          <Box
            component='li'
            key={stepIndex}
            sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}
          >
            <Box sx={numberSx} aria-hidden='true'>
              {stepIndex + 1}
            </Box>
            <Typography sx={{ pt: 0.5, fontSize: '1.0625rem', lineHeight: 1.6 }}>
              {step}
            </Typography>
          </Box>
        ))}
      </Box>

      {notes?.length > 0 && (
        <Box sx={[softInset(theme), { mt: 3, p: 2, borderRadius: 4 }]}>
          <Typography
            variant='subtitle2'
            component='p'
            sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}
          >
            <LightbulbOutlined fontSize='small' />
            Good to know
          </Typography>
          <Box
            component='ul'
            sx={{ m: 0, mt: 1, pl: 3, display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            {notes.map((note, noteIndex) => (
              <Typography component='li' key={noteIndex} variant='body2' sx={{ lineHeight: 1.6 }}>
                {note}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
