import theme from '@/theme';
import { ExpandMore } from '@mui/icons-material';
import { Box, Link, Typography } from '@mui/material';

import LegalList from '@/components/legal/LegalList';
import { legalSectionId } from '@/components/legal/LegalSection';
import { softInset, softPressSx, softRaisedTight } from '@/components/utility/soft';

// The top of /privacy and /terms: the page in a few plain lines, each linking
// to the section that spells it out, then "On this page", every section's
// title as a link. The list is a native <details>, closed at first so the
// summary stays the first thing a driver reads, and it opens with no
// JavaScript (this is a server component). From lg up it gives way to the
// sticky rail LegalPage draws beside the column. `sections` are the titles
// exactly as the page's LegalSections spell them, so the anchors match.
export default function LegalSummary({ items, sections }) {
  return (
    <Box
      component='section'
      aria-labelledby='short-version-title'
      sx={[
        softRaisedTight(theme),
        {
          mt: 4,
          px: { xs: 2.5, sm: 3.5 },
          py: 3,
          borderRadius: 5,
        },
      ]}
    >
      <Typography
        id='short-version-title'
        variant='h5'
        component='h2'
        sx={{ fontWeight: 800, letterSpacing: '-0.01em', mb: 2 }}
      >
        The short version
      </Typography>
      <LegalList items={items} />

      <Box
        component='details'
        sx={[
          softInset(theme),
          {
            // From lg up, LegalPage's rail lists the sections instead.
            display: { lg: 'none' },
            mt: 3,
            borderRadius: 3,
            '&[open] .legal-toc-chevron': { transform: 'rotate(180deg)' },
          },
        ]}
      >
        <Box
          component='summary'
          sx={[
            softPressSx(theme),
            {
              listStyle: 'none',
              '&::-webkit-details-marker': { display: 'none' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              minHeight: '3rem',
              px: 2,
              borderRadius: 3,
              cursor: 'pointer',
              typography: 'subtitle1',
              fontWeight: 700,
              color: 'primary.main',
            },
          ]}
        >
          On this page
          <ExpandMore
            className='legal-toc-chevron'
            aria-hidden='true'
            sx={{
              transition: theme.transitions.create('transform', {
                duration: theme.transitions.duration.short,
                easing: theme.transitions.easing.out,
              }),
            }}
          />
        </Box>
        <Box component='ol' sx={{ listStyle: 'none', m: 0, px: 1, pb: 1.5 }}>
          {sections.map((title) => (
            <li key={title}>
              <Link
                href={`#${legalSectionId(title)}`}
                underline='hover'
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: '2.75rem',
                  px: 1,
                  py: 1,
                  typography: 'body1',
                }}
              >
                {title}
              </Link>
            </li>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
