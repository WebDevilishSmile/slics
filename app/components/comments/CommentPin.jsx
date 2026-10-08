'use client';

import { OpenInNew, PlaceOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';

import { useMapsApp } from '@/hooks/useMapsApp';
import { mapsHref } from '@/lib/geo';

import { softPressSx, softRaisedSmall } from '../utility/soft';

const MAPS_APPS = { google: 'Google Maps', apple: 'Apple Maps' };

// A tip's pinned spot: a soft pill that opens it in the maps app this device
// uses for Navigate (hooks/useMapsApp.js). Shown on /home, on
// a driver's profile and on the admin pages.
function CommentPin({ pin, sx }) {
  const { mapsApp } = useMapsApp();

  return (
    <Button
      size='small'
      href={mapsHref({ parking: pin, name: 'Pinned spot' }, mapsApp)}
      target='_blank'
      rel='noopener noreferrer'
      startIcon={<PlaceOutlined />}
      endIcon={<OpenInNew sx={{ fontSize: '1rem !important' }} />}
      aria-label={`Open the pinned spot in ${MAPS_APPS[mapsApp]}`}
      sx={[softRaisedSmall, softPressSx, { px: 1.5, minHeight: '2.5rem' }, ...(sx ? [sx] : [])]}
    >
      Pinned spot
    </Button>
  );
}

export default CommentPin;
