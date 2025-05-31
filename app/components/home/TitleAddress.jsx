import { ContentCopy } from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';

function TitleAddress({ slic, commentsCount }) {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackMessage, setSnackMessage] = useState(
    'Address copied to clipboard'
  );
  const [snackSeverity, setSnackSeverity] = useState('success');

  const handleCloseSnack = () => {
    setOpenSnackbar(false);
    setSnackMessage('');
    setSnackSeverity('success');
  };

  const handleCopyAddress = async () => {
    const fullAddress = `${slic.address.street}, ${slic.address.city}, ${slic.address.state} ${slic.address.zip}`;

    try {
      await navigator.clipboard.writeText(fullAddress);
      // Optional: You could add a toast notification here to confirm the copy
      setOpenSnackbar(true);
      setSnackMessage('Address copied to clipboard');
      setSnackSeverity('success');
    } catch (err) {
      console.error('Failed to copy address: ', err);
      setOpenSnackbar(true);
      setSnackMessage('Failed to copy address');
      setSnackSeverity('error');
    } finally {
      setTimeout(() => {
        setOpenSnackbar(false);
      }, 3000); // Hide snackbar after 3 seconds
    }
  };

  return (
    <>
      <Typography variant='h6' sx={{ textAlign: 'center' }}>
        {slic?.numSlic} -{' '}
        {slic.type === 'center' || !slic.type ? slic.alphaSlic : slic.name}
      </Typography>

      <Chip
        label={
          commentsCount < 1
            ? 'No comments yet'
            : `${commentsCount} comment${commentsCount > 1 ? 's' : ''}`
        }
      />

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          textAlign: 'center',
          mt: '1rem',
        }}
      >
        <Typography>{slic.address.street}</Typography>
        <Typography>
          {slic.address.city}, {slic.address.state} {slic.address.zip}
        </Typography>

        <Tooltip title='Copy address'>
          <IconButton
            sx={{ position: 'absolute', top: '0', right: '0' }}
            onClick={handleCopyAddress}
          >
            <ContentCopy />
          </IconButton>
        </Tooltip>
      </Box>

      <Snackbar
        open={openSnackbar}
        onClose={handleCloseSnack}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackSeverity} onClose={handleCloseSnack}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default TitleAddress;
