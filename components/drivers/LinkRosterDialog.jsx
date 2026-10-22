'use client';

import { useId, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '@/components/utility/soft';
import { formatSeniority } from './seniority';
import { displayName } from '@/lib/names';

const softListSx = [
  softRaised,
  { mt: 1, borderRadius: 4, '& .MuiAutocomplete-option': { minHeight: '3rem' } },
];

// Links a driver on the sheet to a roster row the merge didn't match by
// itself, e.g. a name changed by marriage. `rosterOnly` are the rows on no
// sheet. Mounted only while open.
export default function LinkRosterDialog({ driver, rosterOnly, onClose, onSaved }) {
  const formId = useId();
  const [row, setRow] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!row) return setError('Pick a roster row.');
    setBusy(true);
    setError('');
    const { error } = await apiRequest(`/api/drivers/${row._id}/link`, {
      method: 'PUT',
      body: { name: driver.name },
    });
    setBusy(false);
    if (error) return setError(error);
    onSaved();
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth='xs'>
      <DialogTitle>Link {displayName(driver.name)}</DialogTitle>
      <DialogContent>
        <Box
          component='form'
          id={formId}
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          <Typography variant='body2' color='text.secondary'>
            Pick their row from the roster drivers who aren&apos;t on the sheet.
            Its employee ID, seniority date and phone show with this driver
            from then on.
          </Typography>
          <Autocomplete
            options={rosterOnly}
            value={row}
            onChange={(event, next) => setRow(next)}
            getOptionLabel={(option) => option.name}
            getOptionKey={(option) => option._id}
            isOptionEqualToValue={(option, current) => option._id === current._id}
            disabled={busy}
            slotProps={{ paper: { sx: softListSx } }}
            renderOption={({ key, ...props }, option) => (
              <Box component='li' key={key} {...props}>
                <Box>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {displayName(option.name)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {formatSeniority(option.seniorityDate)}
                  </Typography>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField {...params} label='Roster row' sx={softInputSx} />
            )}
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
          disabled={busy || !row}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          Link
        </Button>
      </DialogActions>
    </Dialog>
  );
}
