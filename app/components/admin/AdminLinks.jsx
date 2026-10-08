'use client';

import { ChevronRightOutlined } from '@mui/icons-material';
import { Box, Button } from '@mui/material';

import { softPressSx, softRaised } from '../utility/soft';

// A client component because the soft sx helpers are functions, which can't
// be passed from a server page into MUI.
export default function AdminLinks({ links }) {
  return (
    <Box
      component='nav'
      aria-label='Admin sections'
      sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}
    >
      {links.map(({ href, label }, index) => (
        <Button
          key={href}
          href={href}
          className='enter'
          endIcon={<ChevronRightOutlined />}
          sx={[
            softRaised,
            softPressSx,
            {
              '--i': index,
              minHeight: '3.5rem',
              justifyContent: 'space-between',
              px: 3,
              borderRadius: 3,
            },
          ]}
        >
          {label}
        </Button>
      ))}
    </Box>
  );
}
