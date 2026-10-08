'use client';

import { Box, Paper, Skeleton } from '@mui/material';

import { softInset, softRaised, softRaisedSmall } from '../utility/soft';

// The lookup card while it loads (UI-SUGGESTIONS.md #43), shaped like the real
// thing so nothing jumps when it arrives: title and subline with the type
// pill, the address well, Navigate, and the row of action tiles. Soft shapes
// as on the card (utility/soft.js), with skeleton bars inside them.
export default function SlicCardSkeleton() {
  return (
    <Paper
      variant='panel'
      aria-busy='true'
      aria-label='Loading SLIC'
      sx={{ alignItems: 'stretch' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant='text' sx={{ typography: 'h4', width: '45%' }} />
          <Skeleton variant='text' sx={{ width: '70%' }} />
        </Box>
        <Box
          sx={[softRaisedSmall, { width: '5rem', height: '2rem', borderRadius: 999 }]}
        />
      </Box>

      <Box sx={[softInset, { mt: 2.5, p: 2, borderRadius: 4 }]}>
        <Skeleton variant='text' sx={{ width: '75%' }} />
        <Skeleton variant='text' sx={{ width: '55%' }} />
      </Box>

      <Skeleton
        variant='rounded'
        sx={{ mt: 3, height: '3.25rem', borderRadius: 999 }}
      />

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
        {[0, 1, 2].map((tile) => (
          <Box
            key={tile}
            sx={[
              softRaised,
              {
                flex: 1,
                height: '4rem',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
              },
            ]}
          >
            <Skeleton variant='circular' width='1.5rem' height='1.5rem' />
            <Skeleton variant='text' width='2.5rem' />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
