'use client';

import theme from '@/utils/theme';
import { Box, Typography } from '@mui/material';
import SlicActions from '../home/SlicActions';

// /home/[slic] has no comments section, so SlicActions leaves Tips off.
export default function Title({ slic }) {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: theme.layout.width.panel,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography variant='h4'>
        {slic.alphaSlic} / {slic.numSlic}
      </Typography>

      <SlicActions slic={slic} />
    </Box>
  );
}
