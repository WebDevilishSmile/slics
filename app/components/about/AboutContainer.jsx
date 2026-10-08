import theme from '@/utils/theme';
import { Box } from '@mui/material';

import { softRaised } from '../utility/soft';

// One About section: a soft raised card on the page surface.
export default function AboutContainer({ children }) {
  return (
    <Box
      component='section'
      className='enter'
      sx={[
        softRaised(theme),
        {
          width: '100%',
          maxWidth: theme.layout.width.prose,
          mt: 4,
          px: { xs: 3, sm: 4 },
          py: 3,
          borderRadius: 3,
        },
      ]}
    >
      {children}
    </Box>
  );
}
