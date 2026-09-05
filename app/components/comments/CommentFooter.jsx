import { useState } from 'react';
import { Box, Button, Dialog, IconButton, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

function CommentFooter({ comment, author, user, refetchComments }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

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
          <Typography>SLIC {comment.numSlic}</Typography>
          <Typography>
            {dayjs(comment.created_at).format('MMMM D, YYYY')}
          </Typography>
        </Box>
        <Box>
          {user &&
            (author._id.toString() === user.id || user.role === 'admin') && (
              // Only show edit and delete buttons if the comment belongs to the user or user is admin

              <IconButton
                onClick={() => setOpenConfirm(true)}
                disabled={loading}
              >
                <Delete color='error' />
              </IconButton>
            )}
        </Box>

        <Dialog
          open={openConfirm}
          onClose={() => setOpenConfirm(false)}
          disableScrollLock
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 2,
            }}
          >
            <Typography variant='h6'>Confirm Deletion</Typography>
            <Typography sx={{ mt: 1 }}>
              Are you sure you want to delete this comment?
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant='contained' onClick={handleDelete} color='error'>
                Confirm
              </Button>
              <Button
                variant='contained'
                onClick={() => setOpenConfirm(false)}
                color='primary'
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Box>
    </>
  );
}

export default CommentFooter;
