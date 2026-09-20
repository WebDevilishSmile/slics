'use client';

import { useState } from 'react';

import theme from '@/utils/theme';

import { Box, Button, Typography } from '@mui/material';

import DeleteAccountDialog from './DeleteAccountDialog';

// Sits below the comment list, deliberately away from the Settings gear in
// ProfileData so the two aren't a mis-tap apart.
function DeleteAccount({ userId, commentCount }) {
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        maxWidth: theme.layout.width.panel,
        width: '100%',
        mt: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        textAlign: 'center',
      }}
    >
      <Typography variant='body2' color='text.secondary'>
        Deleting your account removes your profile, comments, votes and lookup
        history. This can&apos;t be undone.
      </Typography>
      <Button
        variant='outlined'
        color='error'
        onClick={() => setOpen(true)}
      >
        Delete account
      </Button>

      <DeleteAccountDialog
        open={open}
        onClose={() => setOpen(false)}
        userId={userId}
        commentCount={commentCount}
      />
    </Box>
  );
}

export default DeleteAccount;
