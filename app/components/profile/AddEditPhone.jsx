import { Close } from '@mui/icons-material';
import { Box, Button, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PhoneField from '../newSlic/PhoneField';

function AddEditPhone({
  phone,
  setPhone,
  showSnackbar,
  userData,
  setEditPhone,
  editPhone,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAddPhone = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${userData._id}/add-phone`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phone }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add phone');
      }

      const updatedUser = await response.json();
      showSnackbar('Phone changed successfully', 'success');
      setPhone('');
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setIsSubmitting(false);
      setEditPhone(false);
      router.refresh(); // Refresh the page to reflect changes
    }
  };
  const handleClear = () => {
    setPhone('');
    showSnackbar('Phone cleared', 'info');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <PhoneField phone={phone} setPhone={setPhone} />
        <IconButton
          sx={{ height: '2rem', width: '2rem' }}
          onClick={() => setEditPhone(!editPhone)}
          disabled={isSubmitting}
        >
          <Close />
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Button
          variant='contained'
          color='primary'
          size='small'
          onClick={handleAddPhone}
          disabled={!phone || isSubmitting}
        >
          Add Phone
        </Button>
        <Button
          variant='outlined'
          color='secondary'
          size='small'
          onClick={handleClear}
          disabled={!phone || isSubmitting}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );
}

export default AddEditPhone;
