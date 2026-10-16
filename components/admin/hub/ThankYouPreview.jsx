'use client';

import { useState } from 'react';
import { LocalCafeOutlined } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

import ThankYouNote from '@/components/support/ThankYouNote';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

const KINDS = [
  ['donation.created', 'Coffee'],
  ['membership.started', 'Membership'],
  ['recurring_donation.started', 'Monthly'],
];

// Plays the supporters' thank-you note (support/ThankYouNote.jsx) in the
// super admin hub's Notes (it was on /admin until 2026-10-16), with the super
// admin's own first name, dated the day it's played. A preview only: it
// stamps nothing.
export default function ThankYouPreview({ firstName }) {
  const [open, setOpen] = useState(false);
  // Kept after closing, so the letter doesn't change as it fades out.
  const [type, setType] = useState(KINDS[0][0]);
  const [date, setDate] = useState(null);

  return (
    <Box component='section' aria-labelledby='thank-you-preview'>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <LocalCafeOutlined color='primary' />
        <Typography id='thank-you-preview' variant='subtitle1' component='h4' sx={{ fontWeight: 700 }}>
          Thank-you note
        </Typography>
      </Box>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
        What a supporter finds on /home after a coffee or a membership.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {KINDS.map(([kind, label]) => (
          <Button
            key={kind}
            onClick={() => {
              setType(kind);
              setDate(new Date().toISOString());
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
        date={date}
        firstName={firstName}
      />
    </Box>
  );
}
