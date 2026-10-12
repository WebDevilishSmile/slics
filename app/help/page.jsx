import theme from '@/theme';
import { Box, Chip, Typography } from '@mui/material';

import HelpGuide from '@/components/help/HelpGuide';
import { HELP_SECTIONS } from '@/components/help/guides';
import PageContainer from '@/components/layout/PageContainer';
import AnimatedSlicsMark from '@/components/utility/AnimatedSlicsMark';
import { softPressSx, softRaised, softRaisedSmall } from '@/components/utility/soft';

export const metadata = {
  title: 'Help · SLICs',
};

// /help: plain-language how-to guides for drivers (components/help/guides.jsx).
// Public, like /privacy (middleware.js), so a driver who can't sign in yet can
// still read how to. "Jump to a guide" links each card by its anchor.
export default function HelpPage() {
  return (
    <PageContainer>
      <AnimatedSlicsMark loop sx={{ fontSize: '4rem', mb: 1 }} />
      <Typography variant='sectionHeading' component='h1'>
        How to use SLICs
      </Typography>
      <Typography
        color='text.secondary'
        sx={{ textAlign: 'center', maxWidth: theme.layout.width.prose, mt: 1, px: 1 }}
      >
        Short, step-by-step guides. Tap a topic to jump to it.
      </Typography>

      <Box
        component='nav'
        aria-label='Jump to a guide'
        className='enter'
        sx={[
          softRaised(theme),
          {
            width: '100%',
            maxWidth: theme.layout.width.prose,
            mt: 4,
            px: { xs: 2.5, sm: 4 },
            py: 3,
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          },
        ]}
      >
        {HELP_SECTIONS.map((section) => (
          <Box key={section.id}>
            <Typography variant='subtitle2' component='p' color='text.secondary'>
              {section.title}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
              {section.guides.map((guide) => (
                <Chip
                  key={guide.id}
                  component='a'
                  href={`#${guide.id}`}
                  clickable
                  label={guide.title}
                  sx={[softRaisedSmall(theme), softPressSx(theme), { minHeight: '2.5rem' }]}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {HELP_SECTIONS.map((section) => (
        <Box
          component='section'
          key={section.id}
          aria-labelledby={section.id}
          sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, mt: 6 }}
        >
          <Typography
            id={section.id}
            variant='h4'
            component='h2'
            sx={{ fontWeight: 700, textAlign: 'center', scrollMarginTop: '6rem' }}
          >
            {section.title}
          </Typography>
          {section.guides.map((guide, index) => (
            <HelpGuide key={guide.id} guide={guide} index={index} />
          ))}
        </Box>
      ))}
    </PageContainer>
  );
}
