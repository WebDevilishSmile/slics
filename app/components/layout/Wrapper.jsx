'use client';

import theme from '@/utils/theme';
import { Box, useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';

export default function Wrapper({ children }) {
  const [margin, setMargin] = useState('8%');

  const tablet = useMediaQuery(theme.breakpoints.down('md'));
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (tablet && !mobile) {
      setMargin('5%');
    } else if (mobile && tablet) {
      setMargin('0%');
    } else {
      setMargin('10%');
    }
  });

  return (
    <Box
      sx={{
        px: '1rem',
        py: '4rem',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      {children}
    </Box>
  );
}
