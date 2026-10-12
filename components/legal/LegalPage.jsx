import theme from '@/theme';
import { Box, Link, Typography } from '@mui/material';

import { legalSectionId } from '@/components/legal/LegalSection';
import PageContainer from '@/components/layout/PageContainer';

const railWidth = '13rem';

// The shell of /privacy and /terms, in /help's look: a left-aligned 800-weight
// title, the effective date under it, and one reading column at prose width.
// The page puts LegalSummary first, then its LegalSections, and ends with
// LegalContact. From lg up, `sections` (the titles, as LegalSummary takes
// them) also become a sticky "On this page" rail in the left gutter, so a
// reader deep in the page can still see where they are and jump; below lg
// the summary card's collapsed list does that job.
export default function LegalPage({ title, effective, sections, children }) {
  return (
    <PageContainer>
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: { xs: `minmax(0, ${theme.layout.width.prose})`, lg: `${railWidth} minmax(0, ${theme.layout.width.prose})` },
          justifyContent: 'center',
          columnGap: 6,
        }}
      >
        <Box
          component='nav'
          aria-label='On this page'
          sx={{ display: { xs: 'none', lg: 'block' } }}
        >
          <Box sx={{ position: 'sticky', top: '6rem' }}>
            <Typography variant='subtitle2' component='p' color='text.secondary' sx={{ fontWeight: 700, mb: 1 }}>
              On this page
            </Typography>
            <Box component='ol' sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {sections.map((section) => (
                <li key={section}>
                  <Link
                    href={`#${legalSectionId(section)}`}
                    underline='hover'
                    variant='body2'
                    sx={{ display: 'block', py: 0.75, fontWeight: 600 }}
                  >
                    {section}
                  </Link>
                </li>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography
            variant='h3'
            component='h1'
            sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}
          >
            {title}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>
            Effective {effective}
          </Typography>
          {children}
        </Box>
      </Box>
    </PageContainer>
  );
}
