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
  IconButton,
  Typography,
} from '@mui/material';

import { softContainedSx, softPressSx, softRaisedSmall } from '../utility/soft';

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
            py: 4,
          },
        },
      }}
    >
      {/* Driver details pop-up */}
      <IconButton
        sx={[softPressSx, { position: 'absolute', top: '1rem', right: '1rem' }]}
        aria-label='Close'
        onClick={() => {
          setOpenDialog(false);
          setError('');
        }}
      >
        <Close />
      </IconButton>

      <DialogTitle>Delete Driver</DialogTitle>

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          px: 4,
          mt: 4,
          gap: 2,
        }}
      >
        <Typography>
          Are you sure you want to delete <strong>{driver?.name}</strong>? This
          action cannot be undone.
        </Typography>
        {error && (
          <Alert severity='error' sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          mt: 4,
          px: 4,
        }}
      >
        {/* Action buttons */}
        <Button
          variant='contained'
          color='error'
          onClick={handleDelete}
          disabled={loading}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
          startIcon={
            loading ? <CircularProgress size={16} color='inherit' /> : null
          }
        >
          {loading ? 'Deleting…' : 'Delete'}
        </Button>
        <Button
          onClick={() => {
            setOpenDialog(false);
            setError('');
          }}
          sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
        >
          Cancel
        </Button>
      </Box>
    </Dialog>
  );
}
