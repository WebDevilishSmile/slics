'use client';

import { MoreVertOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function SlicOptions({ slic, onSlicDeleted }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openWarning, setOpenWarning] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('error');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleWarningOpen = () => {
    setAnchorEl(null);
    setOpenWarning(true);
  };

  const handleWarningClose = () => {
    setOpenWarning(false);
  };

  const showSnackbar = (message, severity = 'error') => {
    setSnackMessage(message);
    setSnackSeverity(severity);
    setOpenSnack(true);
  };

  const handleDelete = async () => {
    // Validate data before sending
    if (!slic?._id) {
      showSnackbar('No slic selected to delete', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/slic/${slic._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete slic');
      }

      // Close warning dialog
      setOpenWarning(false);

      // Show success message
      showSnackbar(result.message || 'Slic deleted successfully!', 'success');

      // Notify parent component that slic was deleted
      onSlicDeleted?.(slic._id);

      // Route to admin after a brief delay to show the snackbar
      setTimeout(() => {
        router.push('/admin/slics');
      }, 1500); // 1.5 second delay

      return result;
    } catch (error) {
      console.error('Error deleting slic:', error);

      // More specific error messages
      let errorMessage = 'An error occurred while deleting the slic';

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage =
          'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showSnackbar(errorMessage, 'error');

      // Don't re-throw the error unless parent component needs to handle it
      // throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setAnchorEl(null);
    router.push(`/admin/edit/${slic.numSlic}`);
  };

  const handleCloseSnack = () => {
    setOpenSnack(false);
    setSnackMessage('');
  };

  return (
    <>
      <IconButton onClick={handleClick} size='small'>
        <MoreVertOutlined />
      </IconButton>

      <Menu
        disableScrollLock
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleWarningOpen}>Delete</MenuItem>
      </Menu>

      <Dialog fullScreen open={openWarning} onClose={handleWarningClose}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: '2rem',
          }}
        >
          <Typography textAlign='center' variant='h4' sx={{ mb: '2rem' }}>
            Are you sure you want to delete slic{' '}
            {slic.alphaSlic || slic.numSlic}?
          </Typography>

          <Typography
            textAlign='center'
            variant='body1'
            sx={{ mb: '3rem', color: 'text.secondary' }}
          >
            This action cannot be undone. All data associated with this slic
            will be permanently removed.
          </Typography>

          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <Button
              variant='outlined'
              color='error'
              onClick={handleWarningClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant='contained'
              color='error'
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Snackbar
        open={openSnack}
        onClose={handleCloseSnack}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackSeverity} onClose={handleCloseSnack}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default SlicOptions;
