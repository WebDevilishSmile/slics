'use client';

import { PrintOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';

import { softContainedSx } from '@/components/utility/soft';

// The browser's print dialog, which also offers "Save as PDF" on phones and
// desktops, so the app needs no PDF library. Never printed itself.
export default function PrintButton() {
  return (
    <Button
      variant='contained'
      className='no-print'
      onClick={() => window.print()}
      startIcon={<PrintOutlined />}
      sx={[softContainedSx, { minHeight: '3rem', px: 3 }]}
    >
      Print / save PDF
    </Button>
  );
}
