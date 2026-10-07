'use client';

import { Box } from '@mui/material';
import React from 'react';

// The app shell (app/layout.jsx): header, page and footer in a column at least
// one screen tall, on the page background. The footer pins itself to the
// bottom with `mt: 'auto'`; pages size themselves with layout/PageContainer.jsx.
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
