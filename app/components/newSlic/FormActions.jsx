import { Alert, Box, Button, Snackbar } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function FormActions({ handleClear, slicData, mode = 'create', onSubmit }) {
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('error');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const showSnackbar = (message, severity = 'error') => {
    setSnackMessage(message);
    setSnackSeverity(severity);
    setOpenSnack(true);
  };

  const handleSave = async () => {
    if (!slicData || Object.keys(slicData).length === 0) {
      showSnackbar('No data to save', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      let endpoint = '/api/newSlic';
      let method = 'POST';

      if (mode === 'edit') {
        if (!slicData.numSlic) {
          throw new Error('Missing numSlic for edit');
        }

        endpoint = `/api/slic/${slicData.numSlic}`;
        method = 'PATCH'; // or 'PUT' depending on your route
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slicData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${mode} slic`);
      }

      if (mode === 'create') {
        handleClear();
      }

      showSnackbar(
        mode === 'edit'
          ? 'Slic updated successfully!'
          : 'Slic created successfully!',
        'success'
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push('/admin/slics');
    } catch (error) {
      console.error('Error:', error);

      const errorMessage =
        error.name === 'TypeError' && error.message.includes('fetch')
          ? 'Network error. Please check your connection.'
          : error.message || 'An unexpected error occurred.';

      showSnackbar(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnack = () => {
    setOpenSnack(false);
    setSnackMessage('');
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '30rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        mt: '2rem',
      }}
    >
      <Button variant='contained' onClick={handleSave} disabled={isLoading}>
        {isLoading
          ? mode === 'edit'
            ? 'Updating...'
            : 'Saving...'
          : mode === 'edit'
          ? 'Update'
          : 'Save'}
      </Button>
      <Button
        variant='contained'
        color='error'
        onClick={() => {
          if (mode === 'edit') {
            router.back(); // or `router.back()` if you want to go to the previous page
          } else {
            handleClear();
          }
        }}
        disabled={isLoading}
      >
        {mode === 'edit' ? 'Back' : 'Clear'}
      </Button>

      <Snackbar
        open={openSnack}
        onClose={handleCloseSnack}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackSeverity} onClose={handleCloseSnack}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default FormActions;
