import theme from '@/theme';
import { ArrowUpward, ChevronRight, EmailOutlined } from '@mui/icons-material';
import { Box, Button, Link, Typography } from '@mui/material';

import { CONTACT_EMAIL } from '@/constants';
import ExampleSlicCard, { CARD_CONTROLS } from '@/components/help/ExampleSlicCard';
import HelpGuide from '@/components/help/HelpGuide';
import { HELP_SECTIONS, visibleHelpSections } from '@/components/help/guides';
import { getFeatures } from '@/lib/db/appSettings';
import PageContainer from '@/components/layout/PageContainer';
import AnimatedSlicsMark from '@/components/utility/AnimatedSlicsMark';
import {
  softContainedSx,
  softInset,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '@/components/utility/soft';

export const metadata = {
  title: 'Help · SLICs',
};

const ALL_GUIDES = HELP_SECTIONS.flatMap((section) => section.guides);
const guideById = Object.fromEntries(ALL_GUIDES.map((guide) => [guide.id, guide]));
const CARD_GUIDE_IDS = new Set(CARD_CONTROLS.map((control) => control.guide));

const labelSx = { typography: 'subtitle2', color: 'text.secondary', fontWeight: 700 };

// One row of the index: a link to a guide, pressed in while held. `n` is the
// pin number for a card guide; other guides show their icon.
function IndexRow({ guide, n }) {
  const Icon = guide.icon;
  return (
    <li>
      <Link
        href={`#${guide.id}`}
        underline='none'
        color='text.primary'
        sx={[
          softPressSx(theme),
          {
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            minHeight: '3rem',
            px: 1,
            borderRadius: 3,
            typography: 'body1',
            fontWeight: 600,
          },
        ]}
      >
        <Box
          component='span'
          aria-hidden='true'
          sx={[
            n ? softRaisedSmall(theme) : {},
            {
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              typography: 'caption',
              fontWeight: 800,
            },
          ]}
        >
          {n ?? <Icon fontSize='small' />}
        </Box>
        {guide.title}
        <ChevronRight aria-hidden='true' sx={{ ml: 'auto', color: 'primary.main' }} />
      </Link>
    </li>
  );
}

const listSx = { listStyle: 'none', m: 0, p: 0 };

// /help: plain-language how-to guides for drivers (components/help/guides.jsx),
// in the "show me on the screen" layout (.impeccable/surfaces/app-help-page-jsx.md).
// The page opens on an example SLIC card whose controls carry numbered pins,
// each a link to its guide, with the same guides listed under it and every
// other guide in a quiet index. Each card guide shows the card again with its
// control lit. Public, like /privacy (middleware.js), so a driver who can't
// sign in yet can still read how to. Guides sit open on the page, so the
// pictures are the embossed objects. "Back to guides", once per section,
// returns to #guides;
// "Still stuck?" at the end is the way to reach a person.
// A guide behind a feature switch (`feature` in guides.jsx) shows once it's on.
// getFeatures is the shared cache the switch's save clears, so the page
// follows a change without a deploy.
export default async function HelpPage() {
  const sections = visibleHelpSections(await getFeatures());
  return (
    <PageContainer>
      <Box sx={{ width: '100%', maxWidth: theme.layout.width.prose, display: 'flex', flexDirection: 'column' }}>
        <AnimatedSlicsMark loop sx={{ fontSize: '3rem', alignSelf: 'flex-start' }} />
        <Typography
          variant='h3'
          component='h1'
          sx={{ mt: 1.5, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}
        >
          How to use SLICs
        </Typography>
        <Typography color='text.secondary' sx={{ mt: 1.5 }}>
          Tap a number on the card to see how that button works.
        </Typography>

        <Box id='guides' sx={{ scrollMarginTop: '6rem', maxWidth: theme.layout.width.panel }}>
          <Box className='enter' sx={{ mt: 4 }}>
            <ExampleSlicCard pins />
          </Box>

          <Box component='nav' aria-label='Jump to a guide' sx={{ mt: 4 }}>
            <Typography component='h2' sx={[labelSx, { px: 1, mb: 0.5 }]}>
              On this card
            </Typography>
            <Box component='ol' sx={listSx}>
              {CARD_CONTROLS.map((control, i) => (
                <IndexRow key={control.key} guide={guideById[control.guide]} n={i + 1} />
              ))}
            </Box>

            <Box sx={[softInset(theme), { mt: 3, p: 1.5, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }]}>
              {sections.map((section) => {
                const guides = section.guides.filter((guide) => !CARD_GUIDE_IDS.has(guide.id));
                if (!guides.length) return null;
                return (
                  <Box key={section.id}>
                    <Typography component='p' sx={[labelSx, { px: 1, pt: 0.5 }]}>
                      {section.title}
                    </Typography>
                    <Box component='ul' sx={listSx}>
                      {guides.map((guide) => (
                        <IndexRow key={guide.id} guide={guide} />
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {sections.map((section) => (
          <Box
            component='section'
            key={section.id}
            aria-labelledby={section.id}
            sx={{ display: 'flex', flexDirection: 'column', gap: 6, mt: 8 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
              <Typography
                id={section.id}
                variant='h4'
                component='h2'
                sx={{ fontWeight: 800, letterSpacing: '-0.02em', scrollMarginTop: '6rem' }}
              >
                {section.title}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
                {section.guides.length} guides
              </Typography>
            </Box>
            {section.guides.map((guide) => (
              <HelpGuide key={guide.id} guide={guide} />
            ))}
            <Link
              href='#guides'
              underline='hover'
              variant='body2'
              sx={{ alignSelf: 'flex-end', mt: -3, display: 'inline-flex', alignItems: 'center', gap: 0.5, minHeight: '2.75rem', fontWeight: 600 }}
            >
              <ArrowUpward fontSize='small' aria-hidden='true' />
              Back to guides
            </Link>
          </Box>
        ))}

        <Box
          component='section'
          aria-labelledby='still-stuck'
          sx={[
            softRaised(theme),
            { mt: 7, px: { xs: 2.5, sm: 3.5 }, py: 3, borderRadius: 5, display: 'flex', flexDirection: 'column', gap: 1.5 },
          ]}
        >
          <Typography id='still-stuck' variant='h5' component='h2' sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
            Still stuck?
          </Typography>
          <Typography>
            Email the SLICs admin. Say what you were trying to do and what
            happened on your screen.
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            A wrong address or phone number? Use{' '}
            <Link href='#report'>Something wrong with this SLIC?</Link> under the
            card instead. It goes straight to the admin with the SLIC attached.
          </Typography>
          <Button
            variant='contained'
            href={`mailto:${CONTACT_EMAIL}`}
            startIcon={<EmailOutlined />}
            sx={[softContainedSx(theme), { alignSelf: 'flex-start', minHeight: '3rem', mt: 1 }]}
          >
            Email the admin
          </Button>
        </Box>
      </Box>
    </PageContainer>
  );
}
