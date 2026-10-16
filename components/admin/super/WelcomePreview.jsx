'use client';

import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

import { ROLE_LABELS, STAFF_ROLES } from '@/constants';
import WelcomeNote from '@/components/staff/WelcomeNote';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// Plays the welcome note (staff/WelcomeNote.jsx) for each staff role, with the
// tools that role has now and the super admin's own first name, dated the day
// it's played. A preview only: it stamps nothing.
export default function WelcomePreview({ roleAreas, firstName }) {
  const [open, setOpen] = useState(false);
  // Kept after closing, so the letter doesn't change as it fades out.
  const [role, setRole] = useState(STAFF_ROLES[0]);
  const [date, setDate] = useState(null);

  return (
    <Box>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
        Someone you add, or make an admin, finds a welcome note on /home with a link to their
        tools. Preview it:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {STAFF_ROLES.map((option) => (
          <Button
            key={option}
            onClick={() => {
              setRole(option);
              setDate(new Date().toISOString());
              setOpen(true);
            }}
            aria-haspopup='dialog'
            sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
          >
            {ROLE_LABELS[option]}
          </Button>
        ))}
      </Box>
      <WelcomeNote
        open={open}
        onClose={() => setOpen(false)}
        role={role}
        areas={roleAreas[role]}
        date={date}
        firstName={firstName}
      />
    </Box>
  );
}
