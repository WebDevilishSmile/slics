'use client';

import { useId, useState } from 'react';
import { Close, Delete, MyLocation, OpenInNew } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import theme from '@/utils/theme';
import { apiRequest } from '@/utils/apiRequest';
import { useGeolocation } from '@/utils/clientFunctions';
import { formatLatLng, mapsHref, parseLatLng } from '@/utils/geo';
import { PLACE_CATEGORIES, TRAILER_ACCESS } from '@/utils/variables';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import PhoneField from '../form/PhoneField';
import SlicTagsField from '../form/SlicTagsField';
import PlaceCategoryIcon from './PlaceCategoryIcon';

function toFields(place) {
  return {
    name: place?.name ?? '',
    categories: place?.categories ?? [],
    trailerAccess: place?.trailerAccess ?? 'unknown',
    street: place?.address.street ?? '',
    city: place?.address.city ?? '',
    state: place?.address.state ?? '',
    zip: place?.address.zip ?? '',
    phone: place?.phone ?? '',
    open24h: place?.open24h ?? false,
    hours: place?.hours ?? '',
    parking: place?.parking ? formatLatLng(place.parking) : '',
    slics: place?.slics ?? [],
  };
}

// Add (`place` null) or edit a place. Only rendered for an edit when the
// viewer may manage the place; the API enforces the same rule. Mounted only
// while open, so each opening starts from the place's current values.
function PlaceFormDialog({ place, slics, onClose }) {
  const isEdit = Boolean(place);
  const formId = useId();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { isRefreshing, refresh } = useCommentRefresh();
  const location = useGeolocation();
  const [fields, setFields] = useState(() => toFields(place));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const busy = saving || isRefreshing;

  const set = (key) => (value) =>
    setFields((current) => ({ ...current, [key]: value }));
  const setFromEvent = (key) => (event) => set(key)(event.target.value);

  const toggleCategory = (value) =>
    set('categories')(
      fields.categories.includes(value)
        ? fields.categories.filter((category) => category !== value)
        : [...fields.categories, value],
    );

  const pinText = fields.parking.trim();
  const pin = pinText ? parseLatLng(pinText) : null;
  const pinInvalid = Boolean(pinText) && !pin;

  let pinHelp =
    'Where to pull in. In Google Maps, long-press the spot, copy the coordinates and paste them here. A Google Maps link works too.';
  if (pinInvalid) {
    pinHelp = "Couldn't read that. Paste coordinates or a Google Maps link.";
  } else if (pin && pinText !== formatLatLng(pin)) {
    pinHelp = `Reads as ${formatLatLng(pin)}`;
  }

  const handleUseLocation = async () => {
    const position = await location.request();
    if (position) set('parking')(formatLatLng(position));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (fields.categories.length === 0) {
      setError('Pick at least one category.');
      return;
    }
    if (pinInvalid) {
      setError(
        "Couldn't read the parking pin. Paste coordinates like 40.2732, -76.8867 or a Google Maps link, or clear the field.",
      );
      return;
    }
    if (!fields.street.trim() && !pin) {
      setError('Add a street address or a parking pin so drivers can find it.');
      return;
    }

    setSaving(true);
    setError('');
    const { error } = await apiRequest(
      isEdit ? `/api/places/${place._id}` : '/api/places',
      {
        method: isEdit ? 'PATCH' : 'POST',
        body: {
          name: fields.name,
          categories: fields.categories,
          trailerAccess: fields.trailerAccess,
          address: {
            street: fields.street,
            city: fields.city,
            state: fields.state,
            zip: fields.zip,
          },
          phone: fields.phone,
          open24h: fields.open24h,
          hours: fields.hours,
          parking: pin,
          slics: fields.slics,
        },
      },
    );
    setSaving(false);
    if (error) return setError(error);
    refresh();
    onClose();
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    const { error } = await apiRequest(`/api/places/${place._id}`, {
      method: 'DELETE',
    });
    setSaving(false);
    if (error) {
      setConfirmDelete(false);
      return setError(error);
    }
    refresh();
    onClose();
  };

  const commentCount = place?.commentCount ?? 0;

  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth='sm'
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ pr: 7 }}>{isEdit ? 'Edit place' : 'Add place'}</DialogTitle>
      <IconButton
        onClick={onClose}
        disabled={busy}
        aria-label='Close'
        sx={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}
      >
        <Close />
      </IconButton>

      <DialogContent dividers>
        <Box
          component='form'
          id={formId}
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label='Name'
            required
            value={fields.name}
            onChange={setFromEvent('name')}
            placeholder='e.g. Pilot #312, or I-81 SB rest area, mile 52'
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />

          <Box>
            <FormLabel component='legend' required>
              What&apos;s there?
            </FormLabel>
            <Box
              role='group'
              aria-label='Categories'
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}
            >
              {PLACE_CATEGORIES.map(({ value, label }) => {
                const selected = fields.categories.includes(value);
                return (
                  <Chip
                    key={value}
                    size='medium'
                    icon={<PlaceCategoryIcon category={value} />}
                    label={label}
                    color={selected ? 'primary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => toggleCategory(value)}
                    aria-pressed={selected}
                    disabled={busy}
                  />
                );
              })}
            </Box>
            <FormHelperText>Pick everything that applies.</FormHelperText>
          </Box>

          <TextField
            select
            label='Tractor-trailer access'
            value={fields.trailerAccess}
            onChange={setFromEvent('trailerAccess')}
            disabled={busy}
          >
            {TRAILER_ACCESS.map(({ value, label }) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label='Street'
            value={fields.street}
            onChange={setFromEvent('street')}
            helperText='Leave blank for a rest area and drop a parking pin instead.'
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 120 } }}
          />
          <TextField
            label='City'
            required
            value={fields.city}
            onChange={setFromEvent('city')}
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 60 } }}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label='State'
              required
              value={fields.state}
              onChange={(event) => set('state')(event.target.value.toUpperCase())}
              disabled={busy}
              slotProps={{ htmlInput: { maxLength: 20 } }}
            />
            <TextField
              label='Zip'
              value={fields.zip}
              onChange={setFromEvent('zip')}
              disabled={busy}
              slotProps={{ htmlInput: { maxLength: 10, inputMode: 'numeric' } }}
            />
          </Box>
          <PhoneField
            phone={fields.phone}
            setPhone={set('phone')}
            disabled={busy}
            sx={{ mt: 0, maxWidth: 'none' }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={fields.open24h}
                onChange={(event) => set('open24h')(event.target.checked)}
                disabled={busy}
              />
            }
            label='Open 24 hours'
          />
          {!fields.open24h && (
            <TextField
              label='Hours'
              value={fields.hours}
              onChange={setFromEvent('hours')}
              placeholder='e.g. 5am–11pm daily'
              disabled={busy}
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />
          )}

          <Box>
            <TextField
              label='Parking pin'
              value={fields.parking}
              onChange={setFromEvent('parking')}
              placeholder='40.2732, -76.8867'
              error={pinInvalid}
              helperText={pinHelp}
              disabled={busy}
              fullWidth
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Button
                size='small'
                variant='outlined'
                onClick={handleUseLocation}
                disabled={busy || location.loading}
                startIcon={
                  location.loading ? (
                    <CircularProgress size={16} color='inherit' />
                  ) : (
                    <MyLocation />
                  )
                }
              >
                Use my current location
              </Button>
              {pin && (
                <Button
                  size='small'
                  href={mapsHref({ parking: pin }, 'google')}
                  target='_blank'
                  rel='noopener noreferrer'
                  endIcon={<OpenInNew />}
                >
                  Preview pin
                </Button>
              )}
            </Box>
            {location.error && (
              <Alert severity='warning' sx={{ mt: 1 }}>
                {location.error.message}
              </Alert>
            )}
          </Box>

          <SlicTagsField
            slics={slics}
            value={fields.slics}
            onChange={set('slics')}
            label='On the way to/from (SLICs)'
            placeholder='Add a SLIC'
            disabled={busy}
          />

          {error && <Alert severity='error'>{error}</Alert>}

          {isEdit &&
            (confirmDelete ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  p: 2,
                  border: 1,
                  borderColor: 'error.main',
                  borderRadius: 1,
                }}
              >
                <Typography>
                  Delete this place
                  {commentCount > 0 &&
                    ` and its ${commentCount} comment${commentCount === 1 ? '' : 's'}`}
                  ? This can&apos;t be undone.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button onClick={() => setConfirmDelete(false)} disabled={busy}>
                    Keep it
                  </Button>
                  <Button
                    variant='contained'
                    color='error'
                    onClick={handleDelete}
                    disabled={busy}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                color='error'
                startIcon={<Delete />}
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                sx={{ alignSelf: 'flex-start' }}
              >
                Delete place
              </Button>
            ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          type='submit'
          form={formId}
          variant='contained'
          disabled={busy}
          startIcon={
            saving ? <CircularProgress size={16} color='inherit' /> : null
          }
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add place'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PlaceFormDialog;
