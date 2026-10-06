'use client';

import { Apple, Google, PhoneOutlined } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useAppleDevice } from '@/utils/clientFunctions';
import { mapsHref } from '@/utils/geo';

// Maps open the truck-parking pin when the gym has one, the address otherwise.
// The call link dials digits only and stays in the same tab (tel: needs no
// new window — UI-SUGGESTIONS.md flags both in home/MapPhoneLinks.jsx).
function GymLinks({ gym }) {
  const isAppleDevice = useAppleDevice();
  const phoneDigits = gym.phone?.replace(/\D/g, '');

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button
          variant='contained'
          href={mapsHref(gym, 'google')}
          target='_blank'
          rel='noopener noreferrer'
          startIcon={<Google />}
        >
          Google Maps
        </Button>
        {isAppleDevice && (
          <Button
            variant='contained'
            href={mapsHref(gym, 'apple')}
            target='_blank'
            rel='noopener noreferrer'
            startIcon={<Apple />}
          >
            Apple Maps
          </Button>
        )}
        {phoneDigits && (
          <Button
            variant='outlined'
            href={`tel:${phoneDigits}`}
            startIcon={<PhoneOutlined />}
          >
            {gym.phone}
          </Button>
        )}
      </Box>
      <Typography variant='caption' color='text.secondary'>
        {gym.parking
          ? 'Maps open the truck-parking pin.'
          : 'No parking pin yet. Maps open the address.'}
      </Typography>
    </Box>
  );
}

export default GymLinks;
