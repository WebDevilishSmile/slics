'use client';

import { Box, Paper, Skeleton } from '@mui/material';

import { softInset, softRaisedSmall } from '@/components/utility/soft';

// Chip widths, so the bars read as a few different SLIC names.
const CHIPS = ['7rem', '9.5rem', '6rem', '8.5rem'];

// /home's empty state (home/EmptySlic.jsx) while the page first loads, shaped
// like its usual look for a returning driver: "Recent lookups" with chips,
// the one-line app tip in its well, and the support line. Soft shapes as on
// the real panel, with skeleton bars inside them (UI-SUGGESTIONS.md #43).
export default function EmptySlicSkeleton() {
  return (
    <Paper
      variant='panel'
      aria-busy='true'
      aria-label='Loading recent lookups'
      sx={{ alignItems: 'stretch', gap: 3, viewTransitionName: 'slic-details' }}
    >
      <Box>
        <Skeleton variant='text' sx={{ width: '35%', mb: 1 }} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {CHIPS.map((width) => (
            <Box
              key={width}
              sx={[
                softRaisedSmall,
                {
                  width,
                  height: '2.75rem',
                  borderRadius: 999,
                  px: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                },
              ]}
            >
              <Skeleton variant='circular' width='1.25rem' height='1.25rem' />
              <Skeleton variant='text' sx={{ flex: 1 }} />
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={[
          softInset,
          {
            borderRadius: 4,
            py: 1.5,
            pl: 2,
            pr: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          },
        ]}
      >
        <Skeleton variant='circular' width='1.5rem' height='1.5rem' sx={{ flexShrink: 0 }} />
        {/* Three lines, as most tips run on a phone. */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton variant='text' />
          <Skeleton variant='text' />
          <Skeleton variant='text' sx={{ width: '45%' }} />
        </Box>
        <Box
          sx={[
            softRaisedSmall,
            { flexShrink: 0, width: '2.75rem', height: '2.75rem', borderRadius: '50%' },
          ]}
        />
      </Box>

      {/* The support line, which wraps to two lines on a phone. */}
      <Box>
        <Skeleton variant='text' sx={{ width: '80%', mx: 'auto' }} />
        <Skeleton variant='text' sx={{ width: '35%', mx: 'auto' }} />
      </Box>
    </Paper>
  );
}
