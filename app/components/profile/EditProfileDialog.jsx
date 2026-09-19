import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import PhoneField from '../form/PhoneField';

function EditProfileDialog({ open, onClose, userData, showSnackbar }) {
  const [name, setName] = useState(userData.name || '');
  const [phone, setPhone] = useState(userData.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleClose = () => {
    if (isSubmitting) return;
    setName(userData.name || '');
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
        body: JSON.stringify({ name, phone }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
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
          label='Name'
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
          sx={{ mt: '0.5rem' }}
        />
        <PhoneField phone={phone} setPhone={setPhone} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={!name.trim() || isSubmitting}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditProfileDialog;
