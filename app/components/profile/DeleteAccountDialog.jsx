'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';

const CONFIRM_WORD = 'DELETE';

function DeleteAccountDialog({ open, onClose, userId, commentCount }) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText('');
    setError('');
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: CONFIRM_WORD }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }
      // The account is gone but this device's JWT isn't; signing out clears
      // it and leaves the page. isDeleting stays true — nothing to re-enable.
      await signOut({ redirectTo: '/' });
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  const commentLabel = `${commentCount} comment${commentCount === 1 ? '' : 's'}`;

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : handleClose}
      aria-labelledby='delete-account-title'
      fullWidth
      maxWidth='xs'
    >
      <DialogTitle id='delete-account-title'>Delete your account?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This permanently removes your profile, your{' '}
          <strong>{commentLabel}</strong>, your votes on other comments, and
          your SLIC lookup history. This cannot be undone.
        </DialogContentText>
        <TextField
          label={`Type ${CONFIRM_WORD} to confirm`}
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          autoComplete='off'
          disabled={isDeleting}
          fullWidth
          sx={{ mt: 2 }}
        />
        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='error'
          onClick={handleDelete}
          disabled={confirmText !== CONFIRM_WORD || isDeleting}
          startIcon={
            isDeleting ? <CircularProgress size={16} color='inherit' /> : null
          }
        >
          {isDeleting ? 'Deleting…' : 'Delete account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteAccountDialog;
