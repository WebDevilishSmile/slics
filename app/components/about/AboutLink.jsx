import { Box, Button } from '@mui/material';

import BouncingArrow from '../utility/BouncingArrow';

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
        sx={{ mb: 4 }}
      >
        {children}
      </Button>
    </Box>
  );
}
