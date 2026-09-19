'use client';

import { useState } from 'react';
import { Alert, Box, Button, Snackbar, CircularProgress } from '@mui/material';
import { DeleteForeverOutlined } from '@mui/icons-material';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';

function CommentDelete({ comment }) {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const { isRefreshing, refresh } = useCommentRefresh();

  const handleCloseSnack = () => setSnackbar({ ...snackbar, open: false });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/comment`, {
        // Removed ID from URL string
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment._id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      setSnackbar({
        open: true,
        message: 'Comment deleted successfully!',
        severity: 'success',
      });

      // Give the user a moment to see the success message before the
      // refresh unmounts this comment (and its snackbar) from the list.
      setTimeout(refresh, 1500);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setSnackbar({
        open: true,
        message: 'Could not delete comment. Please try again.',
        severity: 'error',
      });
      setIsDeleting(false);
    }
  };

  return (
    <Box
      sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}
    >
      <Button
        variant='contained'
        color='error'
        startIcon={
          isDeleting || isRefreshing ? (
            <CircularProgress size={20} color='inherit' />
          ) : (
            <DeleteForeverOutlined />
          )
        }
        onClick={handleDelete}
        disabled={isDeleting || isRefreshing}
      >
        {isDeleting
          ? 'Deleting...'
          : isRefreshing
          ? 'Refreshing...'
          : 'Delete Comment'}
      </Button>

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
    </Box>
  );
}

export default CommentDelete;
