import theme from '@/theme';
import { Box, Button } from '@mui/material';
import { Email as EmailIcon, Update as UpdateIcon } from '@mui/icons-material';

import BouncingArrow from '@/components/utility/BouncingArrow';
import { softContainedSx } from '@/components/utility/soft';
import AboutSection from './AboutSection';

export default function Future() {
  return (
    <AboutSection
      title='The Future'
      icon={UpdateIcon}
      action={
        <Box
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <BouncingArrow />
          <Button
            variant='contained'
            href='mailto:webdevilishsmile@gmail.com'
            target='_blank'
            rel='noopener noreferrer'
            sx={[softContainedSx(theme), { mb: 1 }]}
          >
            <EmailIcon sx={{ mr: 1 }} /> Email me
          </Button>
        </Box>
      }
    >
      I would love to expand SLICs to provide other hubs with access to their
      hubs, customers, and PDFs. If you are a UPS Feeder driver and would like
      to see SLICs in your building, please reach out to me via email at the
      link below.
    </AboutSection>
  );
}
