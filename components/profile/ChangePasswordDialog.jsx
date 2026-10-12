'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { CheckCircleOutline, Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/constants';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

const actionSx = { px: 3, minHeight: '3rem' };

// "Change password" on /profile (docs/PASSWORD-RESET.md stage 2), stacked on
// EditProfileDialog. A change signs out every device, this one included
// (the session version goes up), so the dialog says so before the driver
// confirms. Once it's saved this device signs out too, and the dialog stays
// open on "Password changed" with the way to sign in again.
export default function ChangePasswordDialog({ open, onClose, email }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleClose = () => {
    if (saving || done) return;
    setCurrent('');
    setNext('');
    setConfirm('');
    setShow(false);
    setError('');
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (next !== confirm) {
      setError('The new passwords don’t match.');
      return;
    }
    setSaving(true);
    const { error: changeError } = await apiRequest('/api/users/me/password', {
      body: { currentPassword: current, newPassword: next },
    });
    if (changeError) {
      setError(changeError);
      setSaving(false);
      return;
    }
    // The server has already ended this session; this clears its cookie
    // without leaving the page, so the dialog can say what happened.
    await signOut({ redirect: false }).catch(() => {});
    tapHaptic();
    setCurrent('');
    setNext('');
    setConfirm('');
    setSaving(false);
    setDone(true);
  };

  const visibility = (
    <InputAdornment position='end'>
      <IconButton
        onClick={() => setShow((value) => !value)}
        aria-label={show ? 'Hide passwords' : 'Show passwords'}
        aria-pressed={show}
        edge='end'
        sx={softPressSx}
      >
        {show ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );
  const type = show ? 'text' : 'password';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby='change-password-title'
      fullWidth
      maxWidth='xs'
    >
      {done ? (
        <>
          <DialogContent sx={{ pt: 4 }}>
            <Box
              role='status'
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, textAlign: 'center' }}
            >
              <Box sx={{ color: 'primary.main', display: 'flex' }}>
                <CheckCircleOutline fontSize='large' className='pop' />
              </Box>
              <Typography id='change-password-title' variant='h6' component='h2'>
                Password changed
              </Typography>
              <Typography color='text.secondary'>
                You&apos;re signed out everywhere, this device included. Sign in again with your new
                password.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions disableSpacing sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
            <Button
              variant='contained'
              LinkComponent={Link}
              href='/sign-in'
              autoFocus
              sx={[softContainedSx, { px: 4, minHeight: '3rem' }]}
            >
              Sign in
            </Button>
          </DialogActions>
        </>
      ) : (
        <Box component='form' onSubmit={handleSubmit}>
          <DialogTitle id='change-password-title'>Change password</DialogTitle>
          <DialogContent>
            <DialogContentText variant='body2'>
              Changing it signs you out everywhere, this device included. Then you sign in with the
              new password.
            </DialogContentText>
            {/* For password managers: which account this password belongs to. */}
            <input
              type='email'
              name='username'
              autoComplete='username'
              value={email ?? ''}
              readOnly
              hidden
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2.5 }}>
              {error && <Alert severity='error'>{error}</Alert>}
              <TextField
                label='Current password'
                type={type}
                fullWidth
                required
                autoComplete='current-password'
                autoFocus
                disabled={saving}
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
                slotProps={{
                  htmlInput: { maxLength: PASSWORD_MAX_LENGTH },
                  input: { endAdornment: visibility },
                }}
                sx={softInputSx}
              />
              <TextField
                label='New password'
                type={type}
                fullWidth
                required
                autoComplete='new-password'
                disabled={saving}
                helperText={`At least ${PASSWORD_MIN_LENGTH} characters`}
                value={next}
                onChange={(event) => setNext(event.target.value)}
                slotProps={{
                  htmlInput: { minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH },
                }}
                sx={softInputSx}
              />
              <TextField
                label='Confirm new password'
                type={type}
                fullWidth
                required
                autoComplete='new-password'
                disabled={saving}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                slotProps={{ htmlInput: { maxLength: PASSWORD_MAX_LENGTH } }}
                sx={softInputSx}
              />
            </Box>
          </DialogContent>
          <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
            <Button
              onClick={handleClose}
              disabled={saving}
              sx={[softRaisedSmall, softPressSx, actionSx]}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
              sx={[softContainedSx, actionSx]}
            >
              {saving ? 'Changing…' : 'Change'}
            </Button>
          </DialogActions>
        </Box>
      )}
    </Dialog>
  );
}
