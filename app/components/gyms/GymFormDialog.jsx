'use client';

import { useId, useState } from 'react';
import dayjs from 'dayjs';
import { Close, Delete, MyLocation, OpenInNew } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import theme from '@/utils/theme';
import { useGeolocation } from '@/utils/clientFunctions';
import { formatLatLng, mapsHref, parseLatLng } from '@/utils/geo';
import { GYM_STATUSES } from '@/utils/variables';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import PhoneField from '../form/PhoneField';
import { apiRequest } from '@/utils/apiRequest';
import SlicTagsField from '../form/SlicTagsField';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaisedSmall,
} from '../utility/soft';

function toFields(gym) {
  return {
    name: gym?.name ?? '',
    street: gym?.address.street ?? '',
    city: gym?.address.city ?? '',
    state: gym?.address.state ?? '',
    zip: gym?.address.zip ?? '',
    phone: gym?.phone ?? '',
    status: gym?.status ?? 'confirmed',
    open24h: gym?.open24h ?? false,
    hours: gym?.hours ?? '',
    parking: gym?.parking ? formatLatLng(gym.parking) : '',
    slics: gym?.slics ?? [],
    lastVisited: gym?.lastVisited ? dayjs(gym.lastVisited) : null,
  };
}

// Add (`gym` null) or edit a gym. Mounted only while open, so each opening
// starts from the gym's current values.
function GymFormDialog({ gym, slics, onClose }) {
  const isEdit = Boolean(gym);
  const formId = useId();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { isRefreshing, refresh } = useCommentRefresh();
  const location = useGeolocation();
  const [fields, setFields] = useState(() => toFields(gym));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const busy = saving || isRefreshing;

  const set = (key) => (value) =>
    setFields((current) => ({ ...current, [key]: value }));
  const setFromEvent = (key) => (event) => set(key)(event.target.value);

  const pinText = fields.parking.trim();
  const pin = pinText ? parseLatLng(pinText) : null;
  const pinInvalid = Boolean(pinText) && !pin;

  let pinHelp =
    'In Google Maps, long-press where you park, copy the coordinates and paste them here. A Google Maps link works too.';
  if (pinInvalid) {
    pinHelp = "Couldn't read that. Paste coordinates or a Google Maps link.";
  } else if (pin && pinText !== formatLatLng(pin)) {
    pinHelp = `Reads as ${formatLatLng(pin)}`;
  }

  const handleUseLocation = async () => {
    // A pin wants a precise fix, not a quick one (useGeolocation).
    const position = await location.requestPrecise();
    if (position) set('parking')(formatLatLng(position));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pinInvalid) {
      setError(
        "Couldn't read the parking pin. Paste coordinates like 40.2732, -76.8867 or a Google Maps link, or clear the field.",
      );
      return;
    }
    if (fields.lastVisited && !fields.lastVisited.isValid()) {
      setError('Pick a valid last-visited date, or clear it.');
      return;
    }

    setSaving(true);
    setError('');
    const { error } = await apiRequest(
      isEdit ? `/api/gyms/${gym._id}` : '/api/gyms',
      {
        method: isEdit ? 'PATCH' : 'POST',
        body: {
          name: fields.name,
          address: {
            street: fields.street,
            city: fields.city,
            state: fields.state,
            zip: fields.zip,
          },
          phone: fields.phone,
          status: fields.status,
          open24h: fields.open24h,
          hours: fields.hours,
          parking: pin,
          slics: fields.slics,
          lastVisited: fields.lastVisited?.toISOString() ?? null,
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
    const { error } = await apiRequest(`/api/gyms/${gym._id}`, {
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

  const commentCount = gym?.comments.length ?? 0;

  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth='sm'
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ pr: 7 }}>{isEdit ? 'Edit gym' : 'Add gym'}</DialogTitle>
      <IconButton
        onClick={onClose}
        disabled={busy}
        aria-label='Close'
        sx={[
          softPressSx,
          { position: 'absolute', top: '0.75rem', right: '0.75rem' },
        ]}
      >
        <Close />
      </IconButton>

      <DialogContent>
        <Box
          component='form'
          id={formId}
          onSubmit={handleSubmit}
          sx={[softInputSx, { display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }]}
        >
          <TextField
            label='Name'
            required
            value={fields.name}
            onChange={setFromEvent('name')}
            placeholder='e.g. Carlisle – Noble Blvd'
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <TextField
            label='Street'
            required
            value={fields.street}
            onChange={setFromEvent('street')}
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

          <TextField
            select
            label='Status'
            value={fields.status}
            onChange={setFromEvent('status')}
            disabled={busy}
          >
            {GYM_STATUSES.map(({ value, label }) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>

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
              placeholder='e.g. Mon–Thu 5am–11pm, Fri 5am–9pm'
              disabled={busy}
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />
          )}

          <Box>
            <TextField
              label='Truck parking pin'
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
                onClick={handleUseLocation}
                sx={[softRaisedSmall, softPressSx, { px: 2 }]}
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
                  sx={[softRaisedSmall, softPressSx, { px: 1.5 }]}
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

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label='Last visited'
              value={fields.lastVisited}
              onChange={set('lastVisited')}
              disableFuture
              disabled={busy}
              slotProps={{
                field: { clearable: true },
                textField: { fullWidth: true },
              }}
            />
          </LocalizationProvider>

          {error && <Alert severity='error'>{error}</Alert>}

          {isEdit &&
            (confirmDelete ? (
              <Box
                sx={[softInset, { display: 'flex', flexDirection: 'column', gap: 1, p: 2 }]}
              >
                <Typography>
                  Delete this gym
                  {commentCount > 0 &&
                    ` and its ${commentCount} comment${commentCount === 1 ? '' : 's'}`}
                  ? This can&apos;t be undone.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    onClick={() => setConfirmDelete(false)}
                    disabled={busy}
                    sx={[softRaisedSmall, softPressSx, { px: 2 }]}
                  >
                    Keep it
                  </Button>
                  <Button
                    variant='contained'
                    color='error'
                    onClick={handleDelete}
                    disabled={busy}
                    sx={softContainedSx}
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
                sx={[
                  softRaisedSmall,
                  softPressSx,
                  { alignSelf: 'flex-start', px: 2, minHeight: '2.5rem' },
                ]}
              >
                Delete gym
              </Button>
            ))}
        </Box>
      </DialogContent>

<DialogActions disableSpacing sx={{ px: 3, py: 2, gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={busy}
          sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          form={formId}
          variant='contained'
          disabled={busy}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
          startIcon={
            saving ? <CircularProgress size={16} color='inherit' /> : null
          }
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add gym'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GymFormDialog;
