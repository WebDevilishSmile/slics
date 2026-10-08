import theme from '@/theme';
import { Box, Button } from '@mui/material';

import BouncingArrow from '@/components/utility/BouncingArrow';
import { softContainedSx } from '@/components/utility/soft';

export default function AboutLink({ link, children }) {
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <BouncingArrow />
      <Button
        variant='contained'
        href={link}
        target='_blank'
        rel='noopener noreferrer'
        sx={[softContainedSx(theme), { mb: 1 }]}
      >
        {children}
      </Button>
    </Box>
  );
}
