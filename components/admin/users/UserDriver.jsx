'use client';

import { useId, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import SheetNameField from '@/components/admin/driverClaims/SheetNameField';
import VerifiedBadge from '@/components/utility/VerifiedBadge';
import {
  softContainedSx,
  softInset,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

const softButtonSx = [softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }];
const actionsSx = { px: 3, pb: 3, gap: 1.5 };

// An account's driver verification on the admin user page
// (docs/COVER-BIDDING.md): the name it's linked to on the sheet, and Verify /
// Change name / Remove. Verifying here needs no claim, e.g. for a driver the
// admin checked in person. `initial` is what /api/users/[id]/driver answers
// with; `names` is getClaimableDriverNames.
export default function UserDriver({ userId, accountName, initial, names }) {
  const formId = useId();
  const [driver, setDriver] = useState(initial);
  const [dialog, setDialog] = useState(null); // 'link' | 'remove' | null
  const [sheetName, setSheetName] = useState(initial.driverName ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setDialog(null);
    setError('');
  };

  const save = async (method, body) => {
    setBusy(true);
    setError('');
    const { data, error } = await apiRequest(`/api/users/${userId}/driver`, { method, body });
    setBusy(false);
    if (error) return setError(error);
    setDriver(data.data);
    setSheetName(data.data.driverName ?? '');
    setDialog(null);
  };

  return (
    <Box
      sx={[
        softInset,
        { alignSelf: 'stretch', borderRadius: 4, p: 2, mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 },
      ]}
    >
      <Typography variant='subtitle2' component='h2'>
        Driver verification
      </Typography>
      {driver.driverVerified ? (
        <Box>
          <Typography sx={{ fontWeight: 600 }}>
            {driver.driverName}
            <VerifiedBadge />
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Verified {dayjs(driver.verifiedAt).format('MMM D, YYYY')}
            {driver.verifiedBy ? ` by ${driver.verifiedBy}` : ''}
          </Typography>
        </Box>
      ) : (
        <Typography color='text.secondary'>Not a verified driver.</Typography>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <Button onClick={() => setDialog('link')} sx={softButtonSx}>
          {driver.driverVerified ? 'Change name' : 'Verify'}
        </Button>
        {driver.driverVerified && (
          <Button onClick={() => setDialog('remove')} sx={softButtonSx}>
            Remove
          </Button>
        )}
      </Box>
      {error && !dialog && <Alert severity='error'>{error}</Alert>}

      {dialog === 'link' && (
        <Dialog open onClose={busy ? undefined : close} fullWidth maxWidth='xs'>
          <DialogTitle>{driver.driverVerified ? 'Change the sheet name' : `Verify ${accountName}`}</DialogTitle>
          <DialogContent>
            <Box
              component='form'
              id={formId}
              onSubmit={(event) => {
                event.preventDefault();
                save('PUT', { name: sheetName });
              }}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
            >
              <SheetNameField
                names={names}
                value={sheetName}
                onChange={setSheetName}
                claimedName={accountName}
                userId={userId}
                disabled={busy}
              />
              {error && <Alert severity='error'>{error}</Alert>}
            </Box>
          </DialogContent>
          <DialogActions disableSpacing sx={actionsSx}>
            <Button onClick={close} disabled={busy} sx={softButtonSx}>
              Cancel
            </Button>
            <Button
              type='submit'
              form={formId}
              variant='contained'
              disabled={busy || !sheetName.trim()}
              sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
            >
              {driver.driverVerified ? 'Save' : 'Verify'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {dialog === 'remove' && (
        <Dialog open onClose={busy ? undefined : close} fullWidth maxWidth='xs'>
          <DialogTitle>Remove the verification?</DialogTitle>
          <DialogContent>
            <Typography variant='body2' color='text.secondary'>
              {accountName} loses the check mark and the cover list until an
              admin verifies them again.
            </Typography>
            {error && <Alert severity='error' sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions disableSpacing sx={actionsSx}>
            <Button onClick={close} disabled={busy} sx={softButtonSx}>
              Cancel
            </Button>
            <Button
              variant='contained'
              onClick={() => save('DELETE')}
              disabled={busy}
              sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
