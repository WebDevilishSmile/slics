import { Alert, Box, Button, Snackbar } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function FormActions({ handleClear, slicData }) {
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('error'); // Add severity state
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const router = useRouter();

  const showSnackbar = (message, severity = 'error') => {
    setSnackMessage(message);
    setSnackSeverity(severity);
    setOpenSnack(true);
  };

  const handleSave = async () => {
    // Validate data before sending
    if (!slicData || Object.keys(slicData).length === 0) {
      showSnackbar('No data to save', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/newSlic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slicData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create slic');
      }

      // Clear form first
      handleClear();

      // Show success message
      showSnackbar('Slic created successfully!', 'success');

      // Route to admin after a brief delay to show the snackbar
      setTimeout(() => {
        router.push('/admin');
      }, 1500); // 1.5 second delay

      return result;
    } catch (error) {
      console.error('Error creating slic:', error);

      // More specific error messages
      let errorMessage = 'An error occurred while creating the slic';

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage =
          'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showSnackbar(errorMessage, 'error');

      // Don't re-throw the error unless parent component needs to handle it
      // throw error;
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
        {isLoading ? 'Saving...' : 'Save'}
      </Button>
      <Button
        variant='contained'
        color='error'
        onClick={handleClear}
        disabled={isLoading}
      >
        Clear
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
