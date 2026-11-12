'use client';

import { useState } from 'react';
import { EditNoteOutlined } from '@mui/icons-material';
import { Box, Button } from '@mui/material';

import { softPressSx } from '@/components/utility/soft';
import SuggestRouteDialog from '@/components/directions/SuggestRouteDialog';

// "Know the way? Add directions" under a card with no directions
// (docs/SLIC-DIRECTIONS.md, stage 2): a driver writes the route, and an admin
// checks it before anyone sees it. Quiet, like the report link under it.
// Keyed by numSlic in SlicDisplay, so another SLIC starts fresh.
export default function AddDirections({ slic }) {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2.5 }}>
      <Button
        size='small'
        startIcon={<EditNoteOutlined />}
        onClick={() => setOpen(true)}
        aria-haspopup='dialog'
        sx={[softPressSx, { px: 2, minHeight: '3rem', color: 'text.secondary' }]}
      >
        Know the way? Add directions
      </Button>
      {open && <SuggestRouteDialog slic={slic} onClose={() => setOpen(false)} />}
    </Box>
  );
}
