'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Close } from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
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

import theme from '@/theme';
import { apiRequest } from '@/lib/apiRequest';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

const sameName = (a, b) => Boolean(a && b) && a.trim().toLowerCase() === b.trim().toLowerCase();

// "Link to account" on the Supporters page (docs/BMC-SUPPORT.md stage 2):
// attach the support from an email that matched no account to the account the
// driver actually uses. `supporter` is the unmatched row, `accounts` every
// account's `{ _id, name, email }`. An account with the supporter's name is
// suggested first. Mounted only while open.
export default function LinkSupportDialog({ supporter, accounts, onClose }) {
  const formId = useId();
  const router = useRouter();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [account, setAccount] = useState(
    () => accounts.find((option) => sameName(option.name, supporter.name)) ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!account) return setError('Pick an account.');
    setSaving(true);
    setError('');
    const { data, error } = await apiRequest('/api/bmc-events/link', {
      body: { email: supporter.email, userId: account._id },
    });
    setSaving(false);
    if (error) return setError(error);
    setResult(data.data);
    router.refresh();
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth='sm' fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 7 }}>Link to account</DialogTitle>
      <IconButton
        onClick={onClose}
        disabled={saving}
        aria-label='Close'
        sx={[softPressSx, { position: 'absolute', top: '0.75rem', right: '0.75rem' }]}
      >
        <Close />
      </IconButton>

      <DialogContent>
        {result ? (
          <Box role='status' sx={{ pt: 1 }}>
            <Alert severity='success'>
              Linked {result.linked} event{result.linked === 1 ? '' : 's'} to {account.name}.
              {result.membershipGranted && ' Their membership is on now.'}
            </Alert>
          </Box>
        ) : (
          <Box
            component='form'
            id={formId}
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}
          >
            <Typography variant='body2' color='text.secondary' sx={{ overflowWrap: 'anywhere' }}>
              Support from <strong>{supporter.email}</strong>
              {supporter.name ? ` (${supporter.name})` : ''} goes to the account you pick. If their
              latest membership event is a start, membership turns on too. Both are logged.
            </Typography>

            <Autocomplete
              options={accounts}
              value={account}
              onChange={(_event, value) => {
                setAccount(value);
                setError('');
              }}
              getOptionLabel={(option) => `${option.name || 'No name'} · ${option.email}`}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              disabled={saving}
              renderInput={(params) => (
                <TextField {...params} label='Account' placeholder='Search by name or email' sx={softInputSx} />
              )}
            />

            {error && <Alert severity='error'>{error}</Alert>}
          </Box>
        )}
      </DialogContent>

      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        {result ? (
          <Button
            onClick={onClose}
            variant='contained'
            sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              onClick={onClose}
              disabled={saving}
              sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              form={formId}
              variant='contained'
              disabled={saving}
              sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
            >
              {saving ? 'Linking…' : 'Link'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
