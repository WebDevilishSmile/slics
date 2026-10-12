'use client';

import { Box, Skeleton } from '@mui/material';

import theme from '@/theme';
import { softRaisedSmall } from '@/components/utility/soft';

// The SLIC search (home/SlicsSearch.jsx) while /home first loads: the same
// raised pill, as wide and as tall (MUI's outlined Autocomplete input is
// 3.5rem), with an icon and a placeholder-length bar in it. Not a real input:
// a tap on it would do nothing until the page is ready.
export default function SearchBarSkeleton() {
  return (
    <Box
      aria-hidden
      sx={[
        softRaisedSmall,
        {
          width: '100%',
          maxWidth: theme.layout.width.panel,
          height: '3.5rem',
          mt: 3,
          pl: 2,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        },
      ]}
    >
      <Skeleton variant='circular' width='1.5rem' height='1.5rem' />
      <Skeleton variant='text' sx={{ width: '40%' }} />
    </Box>
  );
}
