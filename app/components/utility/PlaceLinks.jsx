'use client';

import { Apple, Google, PhoneOutlined } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useAppleDevice } from '@/utils/clientFunctions';
import { mapsHref } from '@/utils/geo';
import { softContainedSx, softPressSx, softRaisedSmall } from './soft';

// Apple Maps and the phone number: raised soft pills beside the blue button.
const secondarySx = [softRaisedSmall, softPressSx, { px: 2 }];

// Map and call buttons for any `{ name, address, parking, phone }` — gyms on
// the Planet Fitness page and places on Whip It In & Out. Maps open the
// truck-parking pin when there is one, the address otherwise. The call link
// dials digits only and stays in the same tab (tel: needs no new window,
// UI-SUGGESTIONS.md #33). Google Maps is the card's one brand-blue button
// (CLAUDE.md "Visual style"); the rest are soft pills.
function PlaceLinks({ place }) {
  const isAppleDevice = useAppleDevice();
  const phoneDigits = place.phone?.replace(/\D/g, '');

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <Button
          variant='contained'
          href={mapsHref(place, 'google')}
          target='_blank'
          rel='noopener noreferrer'
          startIcon={<Google />}
          sx={softContainedSx}
        >
          Google Maps
        </Button>
        {isAppleDevice && (
          <Button
            href={mapsHref(place, 'apple')}
            target='_blank'
            rel='noopener noreferrer'
            startIcon={<Apple />}
            sx={secondarySx}
          >
            Apple Maps
          </Button>
        )}
        {phoneDigits && (
          <Button
            href={`tel:${phoneDigits}`}
            startIcon={<PhoneOutlined />}
            sx={secondarySx}
          >
            {place.phone}
          </Button>
        )}
      </Box>
      <Typography
        variant='caption'
        color='text.secondary'
        component='p'
        sx={{ mt: 1 }}
      >
        {place.parking
          ? 'Maps open the truck-parking pin.'
          : 'No parking pin yet. Maps open the address.'}
      </Typography>
    </Box>
  );
}

export default PlaceLinks;
