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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import NewDriverField from './NewDriverField';

const emptyForm = {
  firstName: '',
  lastName: '',
  employeeId: '',
  seniorityDate: null,
  phone: '',
};

export default function NewDriverDialog({ open, onClose }) {
  const router = useRouter();
  const [fields, setFields] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (val) => setFields((f) => ({ ...f, [key]: val }));

  const handleClose = () => {
    setFields(emptyForm);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fields.seniorityDate?.isValid()) {
      setError('Please select a valid seniority date.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${fields.firstName.trim()} ${fields.lastName.trim()}`,
          employeeId: fields.employeeId,
          seniorityDate: fields.seniorityDate.format('YYYY-MM-DD'),
          phone: fields.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create driver.');
        return;
      }
      handleClose();
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
      <IconButton
        sx={{ position: 'absolute', top: '1rem', right: '1rem' }}
        onClick={handleClose}
      >
        <Close />
      </IconButton>

      <DialogTitle>New Driver</DialogTitle>
      <Divider sx={{ width: '90%' }} />

      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          px: '2rem',
          mt: '2rem',
          gap: '1rem',
        }}
      >
        <Box sx={{ display: 'flex', gap: '1rem' }}>
          <NewDriverField
            label='First Name'
            value={fields.firstName}
            onChange={set('firstName')}
            required
            disabled={loading}
          />
          <NewDriverField
            label='Last Name'
            value={fields.lastName}
            onChange={set('lastName')}
            required
            disabled={loading}
          />
        </Box>

        <NewDriverField
          label='Employee ID'
          value={fields.employeeId}
          onChange={set('employeeId')}
          required
          disabled={loading}
        />

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label='Seniority Date'
            value={fields.seniorityDate}
            onChange={set('seniorityDate')}
            disabled={loading}
            slotProps={{
              textField: { size: 'small', fullWidth: true, required: true },
            }}
          />
        </LocalizationProvider>

        <NewDriverField
          label='Phone'
          value={fields.phone}
          onChange={set('phone')}
          type='tel'
          disabled={loading}
        />

        {error && <Alert severity='error'>{error}</Alert>}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            mt: '0.5rem',
          }}
        >
          <Button
            type='submit'
            variant='contained'
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={16} color='inherit' /> : null
            }
          >
            {loading ? 'Adding…' : 'Add Driver'}
          </Button>
          <Button variant='outlined' onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
