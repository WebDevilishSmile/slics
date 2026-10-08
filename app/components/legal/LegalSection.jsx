import theme from '@/theme';
import { Box, Typography } from '@mui/material';

import { softRaised } from '../utility/soft';

// One section of the privacy policy or terms: a soft raised card on the page
// surface.
export default function LegalSection({ title, children }) {
  return (
    <Box
      component='section'
      sx={[
        softRaised(theme),
        {
          width: '100%',
          maxWidth: theme.layout.width.prose,
          p: { xs: 3, sm: 4 },
          my: 1.5,
          borderRadius: 3,
        },
      ]}
    >
      <Typography variant='h6' component='h3' sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
