import theme from '@/theme';
import { LightbulbOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

import ExampleSlicCard from '@/components/help/ExampleSlicCard';
import HelpScreen, { HELP_SCREEN_KEYS } from '@/components/help/HelpScreens';
import { softInset, softRaisedSmall } from '@/components/utility/soft';

// The guide's icon in a round inset well.
const iconWellSx = [
  softInset(theme),
  {
    width: '2.75rem',
    height: '2.75rem',
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
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'primary.main',
    typography: 'body2',
    fontWeight: 800,
  },
];

// One how-to guide on /help (guides.jsx), set open on the page rather than in
// a card, so the only embossed things in it are its picture and its notes:
// its title, an optional intro, a picture of the screen with the guide's
// control lit (when the guide has a `screen`), numbered steps, and "Good to
// know" notes in an inset well. The guide's `id` is its anchor;
// scrollMarginTop keeps the title clear of the fixed header when a link jumps
// to it, and `.help-guide:target` (globals.css) rings the guide a link lands
// on, so the driver sees where they arrived. The steps list sets role='list' because Safari drops a list's
// semantics once its bullets are styled away, and each step says "Step n" to
// a screen reader, since the drawn number is hidden from it.
export default function HelpGuide({ guide }) {
  const { id, title, icon: Icon, intro, screen, steps, notes } = guide;

  return (
    <Box
      component='article'
      id={id}
      aria-labelledby={`${id}-title`}
      className='help-guide'
      sx={{ width: '100%', borderRadius: 3, scrollMarginTop: '6rem' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
        <Box sx={iconWellSx}>
          <Icon fontSize='small' />
        </Box>
        <Typography
          id={`${id}-title`}
          variant='h5'
          component='h3'
          sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}
        >
          {title}
        </Typography>
      </Box>

      {intro && (
        <Typography color='text.secondary' sx={{ mt: 1.5 }}>
          {intro}
        </Typography>
      )}

      {screen && (
        <Box sx={[softInset(theme), { mt: 2.5, px: 2, pt: 2.5, pb: 2, borderRadius: 4 }]}>
          {HELP_SCREEN_KEYS.includes(screen) ? (
            <HelpScreen screen={screen} />
          ) : (
            <ExampleSlicCard focus={screen} />
          )}
        </Box>
      )}

      <Box
        component='ol'
        role='list'
        sx={{ listStyle: 'none', p: 0, m: 0, mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {steps.map((step, stepIndex) => (
          <Box
            component='li'
            key={stepIndex}
            sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75 }}
          >
            <Box sx={numberSx} aria-hidden='true'>
              {stepIndex + 1}
            </Box>
            <Typography variant='body1' sx={{ pt: 0.25, lineHeight: 1.6 }}>
              <Box component='span' sx={visuallyHidden}>
                Step {stepIndex + 1}:{' '}
              </Box>
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
