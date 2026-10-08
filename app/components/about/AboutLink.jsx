import theme from '@/utils/theme';
import { Box, Button } from '@mui/material';

import BouncingArrow from '../utility/BouncingArrow';
import { softContainedSx } from '../utility/soft';

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
