'use client';

import { useState } from 'react';
import { KeyOutlined } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

import { ROLE_LABELS, STAFF_ROLES } from '@/constants';
import WelcomeNote from '@/components/staff/WelcomeNote';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// Plays the welcome note (staff/WelcomeNote.jsx) for each staff role in the
// super admin hub's Notes, with the tools that role has now and the super
// admin's own first name, dated the day it's played. A preview only: it
// stamps nothing. `roleAreas` is { admin: [...keys], dispatch: [...keys] }.
export default function WelcomePreview({ roleAreas, firstName }) {
  const [open, setOpen] = useState(false);
  // Kept after closing, so the letter doesn't change as it fades out.
  const [role, setRole] = useState(STAFF_ROLES[0]);
  const [date, setDate] = useState(null);

  return (
    <Box component='section' aria-labelledby='welcome-preview'>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <KeyOutlined color='primary' />
        <Typography id='welcome-preview' variant='subtitle1' component='h4' sx={{ fontWeight: 700 }}>
          Welcome note
        </Typography>
      </Box>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
        What someone finds on /home when you make them an admin or a dispatcher.
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
