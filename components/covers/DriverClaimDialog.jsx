'use client';

import { useId, useState } from 'react';
import dayjs from 'dayjs';
import { Close } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import theme from '@/theme';
import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { DRIVER_NAME_MAX_LENGTH } from '@/constants';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

const EARLIEST_SENIORITY = dayjs('1960-01-01');

// The claim form: who the driver is on the on-call sheet. Mounted only while
// open; a pending `claim` fills it for editing. The server re-checks every
// field (lib/db/driverClaims.js validateDriverClaim).
export default function DriverClaimDialog({ claim, onClose, onSent }) {
  const formId = useId();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [name, setName] = useState(claim?.name ?? '');
  const [email, setEmail] = useState(claim?.employeeEmail ?? '');
  const [seniority, setSeniority] = useState(
    claim?.seniorityDate ? dayjs(claim.seniorityDate) : null,
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return setError('Enter your name as it is on the on-call sheet.');
    if (!email.trim()) return setError('Enter your UPS email.');
    if (!seniority?.isValid()) return setError('Enter your seniority date.');

    setSending(true);
    setError('');
    const { data, error } = await apiRequest('/api/driver-claims', {
      body: {
        name,
        employeeEmail: email,
        seniorityDate: seniority.format('YYYY-MM-DD'),
      },
    });
    setSending(false);
    if (error) return setError(error);
    tapHaptic();
    onSent(data.data);
  };

  return (
    <Dialog
      open
      onClose={sending ? undefined : onClose}
      fullWidth
      maxWidth='xs'
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ pr: 7 }}>Verify you&apos;re a driver</DialogTitle>
      <IconButton
        onClick={onClose}
        disabled={sending}
        aria-label='Close'
        sx={[softPressSx, { position: 'absolute', top: '0.75rem', right: '0.75rem' }]}
      >
        <Close />
      </IconButton>

      <DialogContent>
        <Box
          component='form'
          id={formId}
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}
        >
          <Typography variant='body2' color='text.secondary'>
            An admin checks these against the on-call sheet. Only admins see
            them, and your employee ID and seniority date are deleted once your
            claim is decided.
          </Typography>

          <TextField
            sx={softInputSx}
            label='Name'
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder='First and last name'
            helperText="As it's written on the on-call sheet"
            autoComplete='name'
            disabled={sending}
            slotProps={{ htmlInput: { maxLength: DRIVER_NAME_MAX_LENGTH } }}
          />

          <TextField
            sx={softInputSx}
            label='UPS email'
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder='1234567@ups.com'
            helperText='Your employee ID @ups.com. Nothing is sent to it.'
            autoComplete='off'
            disabled={sending}
            slotProps={{ htmlInput: { inputMode: 'email', maxLength: 40 } }}
          />

          <DatePicker
            label='Seniority date'
            value={seniority}
            onChange={setSeniority}
            disableFuture
            minDate={EARLIEST_SENIORITY}
            disabled={sending}
            slotProps={{
              textField: { required: true, fullWidth: true, sx: softInputSx },
            }}
          />

          {error && <Alert severity='error'>{error}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={sending}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          form={formId}
          variant='contained'
          disabled={sending}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          {sending ? 'Sending…' : claim ? 'Save' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
