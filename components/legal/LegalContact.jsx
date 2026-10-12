import theme from '@/theme';
import { EmailOutlined } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

import { CONTACT_EMAIL } from '@/constants';
import { legalSectionId } from '@/components/legal/LegalSection';
import { softContainedSx, softRaisedTight } from '@/components/utility/soft';

// The close of /privacy and /terms: the Contact section as a raised card with
// the page's one solid blue button, as "Still stuck?" closes /help. Its anchor
// is #contact, like any LegalSection, so "On this page" links to it.
export default function LegalContact({ children }) {
  const id = legalSectionId('Contact');
  return (
    <Box
      component='section'
      id={id}
      aria-labelledby={`${id}-title`}
      className='legal-section'
      sx={[
        softRaisedTight(theme),
        {
          mt: 7,
          px: { xs: 2.5, sm: 3.5 },
          py: 3,
          borderRadius: 5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          scrollMarginTop: '6rem',
        },
      ]}
    >
      <Typography id={`${id}-title`} variant='h5' component='h2' sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
        Contact
      </Typography>
      <Typography>{children}</Typography>
      <Button
        variant='contained'
        href={`mailto:${CONTACT_EMAIL}`}
        startIcon={<EmailOutlined />}
        sx={[softContainedSx(theme), { alignSelf: 'flex-start', minHeight: '3rem', mt: 1 }]}
      >
        Email us
      </Button>
    </Box>
  );
}
