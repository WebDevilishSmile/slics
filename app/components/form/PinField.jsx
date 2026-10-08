'use client';

import { CloseRounded, MyLocation, OpenInNew } from '@mui/icons-material';
import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';

import { useGeolocation } from '@/hooks/useGeolocation';
import { mapsHref, parseLatLng } from '@/utils/geo';

import { softInputSx, softPressSx, softRaisedSmall } from '../utility/soft';

const pillSx = [softRaisedSmall, softPressSx, { px: 1.5, minHeight: '2.5rem' }];

// A GPS fix worse than this gets a warning: the pin may be off by a building.
const ROUGH_FIX_METERS = 30;

// A pin always shows all six decimals (about 10 cm), trailing zeros
// included, so a precise fix never looks rounded off (GPS fills, edit forms).
export const formatPin = ({ lat, lng }) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

// A bare "lat, lng" pair, as opposed to a pasted Maps link.
const PLAIN_PAIR = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;

// Drivers think in feet: "±25 ft".
const feet = (meters) => `±${Math.max(1, Math.round(meters * 3.281))} ft`;

// The pin's text as the driver left it → `{ lat, lng }`, null when it's
// empty, or false when it can't be read (the caller blocks the save).
export function readPin(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return parseLatLng(trimmed) ?? false;
}

// A map pin as text: coordinates or a Google Maps link (utils/geo.js
// parseLatLng), or the device's GPS fix. The parent keeps the text and reads
// it with `readPin`. Below the box: use my location, a preview once it reads
// as a pin, and, with `onRemove`, a way to drop it. "Use my location" waits
// for a precise fix (useGeolocation's requestPrecise) and says how accurate it
// is, warning when it's rough. Soft style: a pressed-in well with its label
// above it, and raised pills (CLAUDE.md "Visual style").
// The places and gyms forms have their own inline copy of this field.
function PinField({
  value,
  onChange,
  onRemove,
  label = 'Pin',
  helperText,
  disabled = false,
}) {
  const location = useGeolocation();
  // How accurate the GPS fix in the box is, in meters; typing clears it.
  const [fixAccuracy, setFixAccuracy] = useState(null);
  const pin = readPin(value);

  let help = helperText;
  if (pin === false) {
    help = "Couldn't read that. Paste coordinates or a Google Maps link.";
  } else if (pin && !PLAIN_PAIR.test(value.trim())) {
    // A link: show the coordinates it was read as.
    help = `Reads as ${formatPin(pin)}`;
  } else if (fixAccuracy !== null) {
    help = `From your location, accurate to about ${feet(fixAccuracy)}.`;
  }

  const handleUseLocation = async () => {
    const position = await location.requestPrecise();
    if (!position) return;
    onChange(formatPin(position));
    setFixAccuracy(position.accuracy);
  };

  return (
    <Box>
      <TextField
        sx={softInputSx}
        label={label}
        value={value}
        onChange={(event) => {
          setFixAccuracy(null);
          onChange(event.target.value);
        }}
        placeholder='40.2732, -76.8867'
        error={pin === false}
        helperText={help}
        disabled={disabled}
        fullWidth
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
        {/* While the GPS settles, the same button takes the fix so far. */}
        <Button
          size='small'
          onClick={location.loading ? location.stop : handleUseLocation}
          disabled={disabled || (location.loading && location.accuracy === null)}
          startIcon={
            location.loading ? (
              <CircularProgress size={16} color='inherit' />
            ) : (
              <MyLocation />
            )
          }
          sx={pillSx}
        >
          {!location.loading
            ? 'Use my location'
            : location.accuracy === null
              ? 'Locating…'
              : 'Use this fix'}
        </Button>
        {pin && (
          <Button
            size='small'
            href={mapsHref({ parking: pin }, 'google')}
            target='_blank'
            rel='noopener noreferrer'
            endIcon={<OpenInNew />}
            sx={pillSx}
          >
            Preview
          </Button>
        )}
        {onRemove && (
          <Button
            size='small'
            onClick={() => {
              setFixAccuracy(null);
              onRemove();
            }}
            disabled={disabled}
            startIcon={<CloseRounded />}
            sx={pillSx}
          >
            Remove pin
          </Button>
        )}
      </Box>
      {/* Progress while the GPS settles, read out politely. */}
      <Typography
        variant='caption'
        color='text.secondary'
        component='p'
        aria-live='polite'
        sx={{ mt: location.loading ? 1 : 0 }}
      >
        {location.loading &&
          `Getting a precise fix${
            location.accuracy !== null ? `: ${feet(location.accuracy)} so far` : ''
          }…`}
      </Typography>
      {location.error && (
        <Alert severity='warning' sx={{ mt: 1 }}>
          {location.error.message}
        </Alert>
      )}
      {fixAccuracy !== null && fixAccuracy > ROUGH_FIX_METERS && (
        <Alert severity='warning' sx={{ mt: 1 }}>
          Your location is only accurate to about {feet(fixAccuracy)}, so the pin
          may be off. For the exact spot, long-press it in Google Maps, copy the
          coordinates and paste them here.
        </Alert>
      )}
    </Box>
  );
}

export default PinField;
