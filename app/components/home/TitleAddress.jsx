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

  // The SLIC leads the card (UI-SUGGESTIONS.md #40): what the driver searched
  // for is the headline, rendered as the card's <h2> so heading navigation
  // still finds it, with the number and the other name on a quiet line below.
  // Centers are known by their alpha code, customers by their name.
  const isCustomer = slic.type === 'customer';
  const headline = isCustomer ? slic.name || slic.alphaSlic : slic.alphaSlic;
  const subline = [`SLIC ${slic.numSlic}`, isCustomer ? slic.alphaSlic : slic.name]
    .filter(Boolean)
    .join(' · ');

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant='h4'
            component='h2'
            sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}
          >
            {headline}
          </Typography>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {subline}
          </Typography>
        </Box>
        <Chip label={isCustomer ? 'Customer' : 'Center'} variant='outlined' />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          mt: 2,
        }}
      >
        <Box>
          <Typography>{slic.address.street}</Typography>
          <Typography>
            {slic.address.city}, {slic.address.state} {slic.address.zip}
          </Typography>
        </Box>
        <Tooltip title='Copy address' placement='top'>
          <IconButton onClick={handleCopyAddress} aria-label='Copy address'>
            <ContentCopy />
          </IconButton>
        </Tooltip>
      </Box>

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
          sx={{ mt: 2 }}
        />
      </Tooltip>

      <Snackbar open={openSnackbar} onClose={handleCloseSnack}>
        <Alert severity={snackSeverity} onClose={handleCloseSnack}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default TitleAddress;
