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
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import theme from '@/theme';
import { apiRequest } from '@/lib/apiRequest';
import { DRIVER_NAME_MAX_LENGTH } from '@/constants';
import PhoneField from '@/components/form/PhoneField';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';
import { displayName } from '@/lib/names';

// The letter after a seniority date: the order of drivers hired that day.
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// 'YYYY-MM-DD-A' → [dayjs, 'A'].
function splitSeniority(value) {
  const match = /^(\d{4}-\d{2}-\d{2})-([A-Z])$/.exec(value ?? '');
  return match ? [dayjs(match[1]), match[2]] : [null, 'A'];
}

/**
 * A driver's roster details: employee ID, seniority date and its letter,
 * phone. Mounted only while open.
 * - `sheetName` with no `driver`: "Add details" for a driver on the sheet. The
 *   new roster row is linked to that name, which stays the sheet's.
 * - `driver` (a roster row): edits it. Its name is editable only when it's on
 *   no sheet (`editName`); otherwise the sheet's spelling is what shows.
 * - Neither: a new roster row for someone not on the sheet.
 */
export default function DriverDetailsDialog({ driver, sheetName, editName = false, onClose, onSaved }) {
  const formId = useId();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [initialDate, initialLetter] = splitSeniority(driver?.seniorityDate);
  const [name, setName] = useState(driver?.name ?? '');
  const [employeeId, setEmployeeId] = useState(driver?.employeeId ?? '');
  const [date, setDate] = useState(initialDate);
  const [letter, setLetter] = useState(initialLetter);
  const [phone, setPhone] = useState(driver?.phone ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const showName = editName || (!driver && !sheetName);
  const title = driver ? 'Edit details' : sheetName ? 'Add details' : 'Add to roster';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!date?.isValid()) return setError('Enter the seniority date.');

    const body = {
      employeeId,
      seniorityDate: `${date.format('YYYY-MM-DD')}-${letter}`,
      phone,
      ...(showName ? { name } : {}),
      ...(!driver && sheetName ? { name: sheetName, sheetName } : {}),
    };
    setBusy(true);
    setError('');
    const { error } = driver
      ? await apiRequest(`/api/drivers/${driver._id}`, { method: 'PATCH', body })
      : await apiRequest('/api/drivers', { body });
    setBusy(false);
    if (error) return setError(error);
    onSaved();
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth='xs' fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 7 }}>{title}</DialogTitle>
      <IconButton
        onClick={onClose}
        disabled={busy}
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
          {showName ? (
            <TextField
              sx={softInputSx}
              label='Name'
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder='LAST, FIRST'
              disabled={busy}
              slotProps={{ htmlInput: { maxLength: DRIVER_NAME_MAX_LENGTH } }}
            />
          ) : (
            <Typography sx={{ fontWeight: 600 }}>{displayName(sheetName ?? driver?.name)}</Typography>
          )}

          <TextField
            sx={softInputSx}
            label='Employee ID'
            required
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            disabled={busy}
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 12 } }}
          />

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <DatePicker
              label='Seniority date'
              value={date}
              onChange={setDate}
              disableFuture
              disabled={busy}
              sx={{ flex: 1 }}
              slotProps={{ textField: { required: true, sx: softInputSx } }}
            />
            <TextField
              select
              label='Order'
              value={letter}
              onChange={(event) => setLetter(event.target.value)}
              disabled={busy}
              sx={[softInputSx, { width: '5.5rem' }]}
              helperText='That day'
            >
              {LETTERS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <PhoneField
            phone={phone}
            setPhone={setPhone}
            disabled={busy}
            sx={[softInputSx, { mt: 0, maxWidth: 'none' }]}
          />

          {error && <Alert severity='error'>{error}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={busy}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          form={formId}
          variant='contained'
          disabled={busy}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
