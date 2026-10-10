'use client';

import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

import ThankYouNote from '@/components/support/ThankYouNote';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

const KINDS = [
  ['donation.created', 'Coffee'],
  ['membership.started', 'Membership'],
  ['recurring_donation.started', 'Monthly'],
];

// Plays the supporters' thank-you note (support/ThankYouNote.jsx) on /admin,
// with the admin's own first name. A preview only: it stamps nothing.
export default function ThankYouPreview({ firstName }) {
  const [open, setOpen] = useState(false);
  // Kept after closing, so the letter doesn't change as it fades out.
  const [type, setType] = useState(KINDS[0][0]);

  return (
    <Box component='section' aria-labelledby='thank-you-preview' sx={{ width: '100%' }}>
      <Typography id='thank-you-preview' variant='h6' component='h3'>
        Thank-you note
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
        What a supporter sees on /home. Preview it:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {KINDS.map(([kind, label]) => (
          <Button
            key={kind}
            onClick={() => {
              setType(kind);
              setOpen(true);
            }}
            aria-haspopup='dialog'
            sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
          >
            {label}
          </Button>
        ))}
      </Box>
      <ThankYouNote
        open={open}
        onClose={() => setOpen(false)}
        type={type}
        firstName={firstName}
      />
    </Box>
  );
}
