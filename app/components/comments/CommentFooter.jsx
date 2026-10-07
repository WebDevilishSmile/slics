import { useId, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

function CommentFooter({ comment, author, user, slicName, refetchComments }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const titleId = useId();

  const handleDelete = async () => {
    console.log(`Deleting comment with ID ${comment._id.toString()}`);
    try {
      setLoading(true);
      const response = await fetch(`/api/comments/${comment._id.toString()}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
      // Optionally, you can trigger a refetch of comments here
      refetchComments();
      router.refresh();
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1,
          px: 2,
        }}
      >
        {/* COMMENT FOOTER */}

        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
          <Typography variant='body2'>{slicName || comment.numSlic}</Typography>
          <Typography variant='body2'>
            {dayjs(comment.created_at).format('MMMM D, YYYY')}
          </Typography>
        </Box>
        <Box>
          {user &&
            (author._id.toString() === user.id || user.role === 'admin') && (
              // Only show edit and delete buttons if the comment belongs to the user or user is admin

              <Tooltip title='Delete Comment' placement='top'>
                <IconButton
                  onClick={() => setOpenConfirm(true)}
                  disabled={loading}
                  size='small'
                  aria-label='delete comment'
                >
                  <Delete color='error' />
                </IconButton>
              </Tooltip>
            )}
        </Box>

        {/* The title names the dialog for screen readers (UI-SUGGESTIONS.md #33). */}
        <Dialog
          open={openConfirm}
          onClose={() => setOpenConfirm(false)}
          aria-labelledby={titleId}
          disableScrollLock
        >
          <DialogTitle id={titleId}>Delete this comment?</DialogTitle>
          <DialogContent>
            <DialogContentText>This can&apos;t be undone.</DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
            <Button
              variant='contained'
              color='error'
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}

export default CommentFooter;
