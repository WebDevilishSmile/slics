'use client';

import { Box, Typography } from '@mui/material';
import WestIcon from '@mui/icons-material/West';
import theme from '../utilities/theme';

export default function HeaderTitle({ session, userName }) {
  return (
    <Box>
      {session ? (
        <Typography
          sx={{ textTransform: 'uppercase', color: theme.palette.text.light }}
        >
          Hello {userName}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <WestIcon fontSize='small' />
          <Typography
            sx={{ textTransform: 'uppercase', color: theme.palette.text.light }}
          >
            {' '}
            Please Login
          </Typography>
        </Box>
      )}
    </Box>
  );
}
