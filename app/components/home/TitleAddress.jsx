import {
  Check,
  ContentCopy,
  ErrorOutline,
  PlaceOutlined,
} from '@mui/icons-material';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { tapHaptic } from '@/utils/clientFunctions';

import {
  softInset,
  softPressSx,
  softRaisedSmall,
} from '../utility/soft';

// How long the copy button shows its result before going back to the copy icon.
const COPY_FEEDBACK_MS = 1500;

// Read by screen readers, never shown (the usual clip pattern).
const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
  padding: 0,
  margin: '-1px',
};

function TitleAddress({ slic }) {
  // 'idle' | 'copied' | 'failed'. Feedback lives on the button itself, not in
  // a toast over the search (UI-SUGGESTIONS.md #51): the icon becomes a check
  // (or an error mark) for 1.5s, and a polite live region says what happened.
  const [copyState, setCopyState] = useState('idle');
  const [announcement, setAnnouncement] = useState('');
  const resetTimer = useRef(null);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleCopyAddress = async () => {
    const fullAddress = `${slic.address.street}, ${slic.address.city}, ${slic.address.state} ${slic.address.zip}`;
    clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopyState('copied');
      setAnnouncement('Address copied');
      tapHaptic();
    } catch (err) {
      console.error('Failed to copy address: ', err);
      setCopyState('failed');
      setAnnouncement("Couldn't copy the address");
    }
    resetTimer.current = setTimeout(() => setCopyState('idle'), COPY_FEEDBACK_MS);
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
        {/* A small raised pill in the brand color (utility/soft.js). */}
        <Chip
          label={isCustomer ? 'Customer' : 'Center'}
          sx={[
            softRaisedSmall,
            {
              color: 'primary.main',
              fontWeight: 600,
              letterSpacing: '0.04em',
              flexShrink: 0,
            },
          ]}
        />
      </Box>

      {/* The address sits in a well pressed into the card, with the copy
          button as a small raised disc that presses in when tapped. */}
      <Box
        sx={[
          softInset,
          {
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mt: 2.5,
            p: 2,
            borderRadius: 4,
          },
        ]}
      >
        <PlaceOutlined sx={{ color: 'primary.main', flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography>{slic.address.street}</Typography>
          <Typography>
            {slic.address.city}, {slic.address.state} {slic.address.zip}
          </Typography>
        </Box>
        <Tooltip title='Copy address' placement='top'>
          <IconButton
            onClick={handleCopyAddress}
            aria-label='Copy address'
            sx={[
              softRaisedSmall,
              softPressSx,
              {
                flexShrink: 0,
                color:
                  copyState === 'copied'
                    ? 'success.main'
                    : copyState === 'failed'
                      ? 'error.main'
                      : undefined,
              },
            ]}
          >
            {/* Keyed so each state's icon mounts fresh and pops in (.pop). */}
            {copyState === 'copied' ? (
              <Check key='copied' fontSize='small' className='pop' />
            ) : copyState === 'failed' ? (
              <ErrorOutline key='failed' fontSize='small' className='pop' />
            ) : (
              <ContentCopy key='idle' fontSize='small' />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Box role='status' aria-live='polite' sx={visuallyHidden}>
        {announcement}
      </Box>
    </Box>
  );
}

export default TitleAddress;
