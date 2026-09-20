import { ChatBubbleOutline, ContentCopy } from '@mui/icons-material';
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
import { COMMENTS_SECTION_ID } from '@/utils/variables';

function TitleAddress({ slic, commentsCount }) {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackMessage, setSnackMessage] = useState(
    'Address copied to clipboard',
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

  const handleScrollToComments = () => {
    // The comments section renders whenever a slic is selected, which is the
    // only time this chip is shown — the guard is just belt-and-braces.
    document
      .getElementById(COMMENTS_SECTION_ID)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {slic?.type === 'customer' && (
        <Typography variant='h6' sx={{ textAlign: 'center' }}>
          {slic.name}
        </Typography>
      )}
      <Typography variant='h6' sx={{ textAlign: 'center' }}>
        {slic?.numSlic} - {slic?.alphaSlic}
      </Typography>

      <Tooltip title='Scroll to comments' placement='top'>
        <Chip
          size='medium' // the theme default is small; this one is a page-level stat
          icon={<ChatBubbleOutline />}
          label={
            commentsCount < 1
              ? 'No comments yet'
              : `${commentsCount} comment${commentsCount > 1 ? 's' : ''}`
          }
          clickable
          onClick={handleScrollToComments}
          aria-label='Scroll to comments'
        />
      </Tooltip>

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          textAlign: 'center',
          mt: 2,
        }}
      >
        <Typography>{slic.address.street}</Typography>
        <Typography>
          {slic.address.city}, {slic.address.state} {slic.address.zip}
        </Typography>

        <Tooltip title='Copy address' placement='top'>
          <IconButton
            sx={{ position: 'absolute', top: '0', right: '0' }}
            onClick={handleCopyAddress}
          >
            <ContentCopy />
          </IconButton>
        </Tooltip>
      </Box>

      <Snackbar open={openSnackbar} onClose={handleCloseSnack}>
        <Alert severity={snackSeverity} onClose={handleCloseSnack}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default TitleAddress;
