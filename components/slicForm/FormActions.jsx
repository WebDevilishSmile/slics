import theme from '@/theme';
import { Alert, Box, Button, Snackbar } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { softContainedSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';

function FormActions({
  handleClear,
  slicData,
  slicId,
  mode = 'create',
  onSubmit,
  isComplete,
  reportId,
}) {
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
    if (!isComplete) {
      showSnackbar('Please fill in all required fields.', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      let endpoint = '/api/slics';
      let method = 'POST';

      if (mode === 'edit') {
        if (!slicId) {
          throw new Error('Missing slic ID for edit');
        }

        endpoint = `/api/slics/${slicId}`;
        method = 'PATCH';
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

      // Opened from a driver report's Fix: the save resolves it, and the
      // admin goes back to the queue. The SLIC is saved either way.
      let reportStillOpen = false;
      if (reportId) {
        const report = await fetch(`/api/slic-reports/${reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'resolved' }),
        }).catch(() => null);
        reportStillOpen = !report?.ok;
      }

      showSnackbar(
        reportStillOpen
          ? "SLIC updated, but the report couldn't be closed. Dismiss it from the queue."
          : mode === 'edit'
            ? 'SLIC updated.'
            : 'SLIC created.',
        reportStillOpen ? 'warning' : 'success'
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push(reportId ? '/admin/reports' : '/admin/slics');
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
        maxWidth: theme.layout.width.field,
        display: 'flex',
        justifyContent: 'center',
        gap: 4,
        mt: 4,
      }}
    >
      <Button
        variant='contained'
        onClick={handleSave}
        disabled={isLoading}
        sx={[softContainedSx, { px: 4, minHeight: '3rem' }]}
      >
        {isLoading
          ? mode === 'edit'
            ? 'Updating...'
            : 'Saving...'
          : mode === 'edit'
          ? 'Update'
          : 'Save'}
      </Button>
      {/* Editing has no Back of its own: the header's back arrow is the way
          out (UI-SUGGESTIONS.md #52, #57). */}
      {mode === 'create' && (
        <Button
          sx={[softRaisedSmall, softPressSx, { px: 4, minHeight: '3rem' }]}
          onClick={handleClear}
          disabled={isLoading}
        >
          Clear
        </Button>
      )}

      <Snackbar
        open={openSnack}
        onClose={handleCloseSnack}
      >
        <Alert severity={snackSeverity} onClose={handleCloseSnack}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default FormActions;
