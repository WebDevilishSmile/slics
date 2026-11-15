'use client';

import { useState } from 'react';
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

import { apiRequest } from '@/lib/apiRequest';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const sameEmail = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// The super admin deletes a driver's account (docs/ADMIN-USER-DELETION.md),
// modeled on profile/DeleteAccountDialog.jsx. Confirmed by typing the account's
// email, which POST /api/users/[id]/admin-delete checks again. `onDeleted` runs
// after the server says it's done.
function DeleteUserDialog({ open, onClose, onDeleted, userId, name, email, commentCount = 0, viewCount = 0 }) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmEmail('');
    setReason('');
    setError('');
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    const { error: deleteError } = await apiRequest(`/api/users/${userId}/admin-delete`, {
      method: 'POST',
      body: { confirmEmail, reason },
    });
    if (deleteError) {
      setError(deleteError);
      setIsDeleting(false);
      return;
    }
    // isDeleting stays true: the page leaves.
    onDeleted?.();
  };

  const matches = Boolean(email) && sameEmail(confirmEmail, email);

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : handleClose}
      aria-labelledby='delete-user-title'
      fullWidth
      maxWidth='xs'
    >
      <DialogTitle id='delete-user-title'>Delete {name || 'this'}&apos;s account?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This permanently removes their profile, their{' '}
          <strong>{plural(commentCount, 'tip')}</strong> (a &quot;Comment deleted&quot;
          note stays where others replied), their votes,{' '}
          <strong>{plural(viewCount, 'lookup')}</strong> in their history, their cover
          lists and the devices they turned notifications on for.
        </DialogContentText>
        <DialogContentText sx={{ mt: 1.5 }}>
          Buy Me a Coffee support, SLIC reports and suggested directions stay, without
          their name. They&apos;re signed out everywhere. This can&apos;t be undone, and
          they can sign up again with the same email.
        </DialogContentText>
        <TextField
          label='Reason (only admins see it)'
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          autoComplete='off'
          disabled={isDeleting}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 200 } }}
          sx={[softInputSx, { mt: 2.5 }]}
        />
        <TextField
          label='Type their email to confirm'
          value={confirmEmail}
          onChange={(event) => setConfirmEmail(event.target.value)}
          autoComplete='off'
          autoCapitalize='none'
          spellCheck={false}
          disabled={isDeleting}
          fullWidth
          helperText={email}
          sx={[softInputSx, { mt: 2 }]}
        />
        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button
          onClick={handleClose}
          disabled={isDeleting}
          sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          color='error'
          onClick={handleDelete}
          disabled={!matches || isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} color='inherit' /> : null}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          {isDeleting ? 'Deleting…' : 'Delete account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteUserDialog;
