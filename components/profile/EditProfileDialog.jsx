import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import PhoneField from '@/components/form/PhoneField';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';
import ChangePasswordDialog from './ChangePasswordDialog';
import DeleteAccountDialog from './DeleteAccountDialog';

// Credentials users are registered with firstName/lastName; OAuth users only
// have the provider's display name, so fall back to splitting that on the
// first space.
const initialNames = (userData) => {
  if (userData.firstName || userData.lastName) {
    return {
      first: userData.firstName || '',
      last: userData.lastName || '',
    };
  }
  const [first = '', ...rest] = (userData.name || '').trim().split(/\s+/);
  return { first, last: rest.join(' ') };
};

function EditProfileDialog({
  open,
  onClose,
  userData,
  commentCount,
  showSnackbar,
}) {
  const [firstName, setFirstName] = useState(initialNames(userData).first);
  const [lastName, setLastName] = useState(initialNames(userData).last);
  const [phone, setPhone] = useState(userData.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const router = useRouter();

  const handleClose = () => {
    if (isSubmitting) return;
    const { first, last } = initialNames(userData);
    setFirstName(first);
    setLastName(last);
    setPhone(userData.phone || '');
    onClose();
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${userData._id}/add-phone`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      showSnackbar('Profile updated successfully', 'success');
      onClose();
      router.refresh();
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='xs'>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        <TextField
          label='First name'
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          autoComplete='given-name'
          fullWidth
          sx={[softInputSx, { mt: 1 }]}
        />
        <TextField
          label='Last name'
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          autoComplete='family-name'
          fullWidth
          sx={[softInputSx, { mt: 2.5 }]}
        />
        <PhoneField
          phone={phone}
          setPhone={setPhone}
          sx={[softInputSx, { mt: 2.5, maxWidth: 'none' }]}
        />

        {/* Password accounts only: a Google account's password is Google's. */}
        {userData.hasPassword && (
          <Box sx={[softInset, { mt: 4, p: 2, borderRadius: 4 }]}>
            <Typography variant='subtitle2'>Password</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
              Choose a new one. You&apos;ll sign in again on every device.
            </Typography>
            <Button
              size='small'
              onClick={() => setPasswordOpen(true)}
              disabled={isSubmitting}
              sx={[softRaisedSmall, softPressSx, { px: 1.5 }]}
            >
              Change password
            </Button>
          </Box>
        )}

        {/* Admins can't delete themselves here (the route refuses too), so
            the last admin can't lock everyone out. */}
        {userData.role !== 'admin' && (
          // Set apart in a pressed-in well rather than behind a divider.
          <Box sx={[softInset, { mt: userData.hasPassword ? 2.5 : 4, p: 2, borderRadius: 4 }]}>
            <Typography variant='subtitle2'>Delete account</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
              Removes your profile, comments, votes and lookup history. This
              can&apos;t be undone.
            </Typography>
            <Button
              color='error'
              size='small'
              onClick={() => setDeleteOpen(true)}
              disabled={isSubmitting}
              sx={[softRaisedSmall, softPressSx, { px: 1.5 }]}
            >
              Delete account
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button onClick={handleClose} disabled={isSubmitting} sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={!firstName.trim() || !lastName.trim() || isSubmitting}
          sx={softContainedSx}
        >
          Save
        </Button>
      </DialogActions>

      {/* Stacked on top of this dialog: cancelling returns here, confirming
          signs the user out (a password change stays on its "Password
          changed" message; a delete leaves the page). */}
      <ChangePasswordDialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        email={userData.email}
      />
      <DeleteAccountDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        userId={userData._id}
        commentCount={commentCount}
      />
    </Dialog>
  );
}

export default EditProfileDialog;
