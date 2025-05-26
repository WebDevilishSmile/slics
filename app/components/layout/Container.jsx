'use client';

import { Box } from '@mui/material';
import React from 'react';

export default function Container({ children }) {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        fontSize: '1.6rem',
      }}
    >
      {children}
    </Box>
  );
}
