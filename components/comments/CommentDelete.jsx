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
  IconButton,
  Snackbar,
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import {
  softContainedSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

// The delete button on a CommentCard: a soft icon button that asks first, as
// the tips on /home do. While any delete in the list is refreshing the
// server-rendered list (CommentRefreshContext), every button waits.
function CommentDelete({ comment }) {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isRefreshing, refresh } = useCommentRefresh();
  const busy = isDeleting || isRefreshing;

  const handleCloseSnack = () => setSnackbar({ ...snackbar, open: false });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comments/${comment._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      setConfirmOpen(false);
      setSnackbar({
        open: true,
        message: 'Tip deleted.',
        severity: 'success',
      });

      // Give the user a moment to see the success message before the
      // refresh unmounts this comment (and its snackbar) from the list.
      setTimeout(refresh, 1500);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setConfirmOpen(false);
      setSnackbar({
        open: true,
        message: 'Could not delete the tip. Please try again.',
        severity: 'error',
      });
      setIsDeleting(false);
    }
  };

  return (
    <>
      <IconButton
        aria-label={`Delete tip on SLIC ${comment.numSlic}`}
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        sx={[softPressSx, { width: '2.5rem', height: '2.5rem' }]}
      >
        {busy ? (
          <CircularProgress size={18} color='inherit' />
        ) : (
          <DeleteOutline fontSize='small' color='error' />
        )}
      </IconButton>

      <Dialog
        open={confirmOpen}
        onClose={isDeleting ? undefined : () => setConfirmOpen(false)}
        aria-labelledby={`delete-${comment._id}`}
      >
        <DialogTitle id={`delete-${comment._id}`}>Delete this tip?</DialogTitle>
        <DialogContent>
          <DialogContentText>This can&apos;t be undone.</DialogContentText>
        </DialogContent>
        <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={isDeleting}
            sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDelete}
            disabled={isDeleting}
            startIcon={
              isDeleting ? <CircularProgress size={16} color='inherit' /> : null
            }
            sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnack}
      >
        <Alert
          onClose={handleCloseSnack}
          variant='filled'
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default CommentDelete;
