'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Close } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';

export default function DeleteDriverDialog({
  openDialog,
  setOpenDialog,
  driver,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/drivers/${driver._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete driver.');
      setOpenDialog(false);
      router.refresh();
    } catch {
      setError('Failed to delete driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={openDialog}
      onClose={() => {
        setOpenDialog(false);
        setError('');
      }}
      slotProps={{
        paper: {
          sx: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: '2rem',
          },
        },
      }}
    >
      {/* Driver details pop-up */}
      <IconButton
        sx={{ position: 'absolute', top: '1rem', right: '1rem' }}
        aria-label='Close'
        onClick={() => {
          setOpenDialog(false);
          setError('');
        }}
      >
        <Close />
      </IconButton>

      <DialogTitle>Delete Driver</DialogTitle>
      <Divider width='90%' />

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          px: '2rem',
          mt: '2rem',
          gap: '1rem',
        }}
      >
        <Typography>
          Are you sure you want to delete <strong>{driver?.name}</strong>? This
          action cannot be undone.
        </Typography>
        {error && (
          <Alert severity='error' sx={{ mt: '0.5rem' }}>
            {error}
          </Alert>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          mt: '2rem',
          px: '2rem',
        }}
      >
        {/* Action buttons */}
        <Button
          variant='contained'
          color='error'
          onClick={handleDelete}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={16} color='inherit' /> : null
          }
        >
          {loading ? 'Deleting…' : 'Delete'}
        </Button>
        <Button
          variant='outlined'
          onClick={() => {
            setOpenDialog(false);
            setError('');
          }}
        >
          Cancel
        </Button>
      </Box>
    </Dialog>
  );
}
