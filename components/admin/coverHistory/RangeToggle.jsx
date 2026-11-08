'use client';

import { Box, Button } from '@mui/material';

import { softToggleSx } from '@/components/utility/soft';

const LABELS = { 8: '8 weeks', 12: '12 weeks', 26: '6 months', 52: 'A year', all: 'All' };

// How far back Cover History reads: chips that press in (aria-pressed), each
// a move of `?range=` (useHistoryNav).
export default function RangeToggle({ ranges, range, onChange, disabled }) {
  return (
    <Box role='group' aria-label='How far back' sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
      {ranges.map((value) => (
        <Button
          key={value}
          aria-pressed={value === range}
          disabled={disabled}
          onClick={() => onChange(value)}
          sx={[softToggleSx, { minHeight: '2.75rem', px: 2, borderRadius: 999 }]}
        >
          {LABELS[value] ?? value}
        </Button>
      ))}
    </Box>
  );
}
