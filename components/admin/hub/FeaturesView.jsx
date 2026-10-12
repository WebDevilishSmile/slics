'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '@/components/utility/soft';
import { formatDay, formatWhen } from './format';

// /admin/super/features (docs/SUPER-ADMIN-HUB.md stage F, lib/db/appSettings.js):
// switches that used to need a deploy. Each change asks first, is written to
// the admin audit, and reaches every driver on their next request. A switch
// nobody has changed shows the code's default (constants.js).

function Changed({ features, featureKey }) {
  const change = features.changed?.[featureKey];
  return (
    <Typography variant='caption' color='text.secondary' component='p'>
      {features.saved?.[featureKey] && change
        ? `Changed ${formatWhen(change.at)}${change.by?.name ? ` by ${change.by.name}` : ''}`
        : 'The code’s default (constants.js)'}
    </Typography>
  );
}

function FeatureCard({ title, children }) {
  return (
    <Box
      component='section'
      aria-label={title}
      sx={[softRaised, { borderRadius: 4, p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.5 }]}
    >
      {children}
    </Box>
  );
}

// 'YYYY-MM-DD' of an ISO time, as the date input takes it (UTC, the way the
// default PLACES_NEW_UNTIL is written).
const dateOf = (iso) => (iso ? iso.slice(0, 10) : '');

export default function FeaturesView({ initial }) {
  const router = useRouter();
  const [features, setFeatures] = useState(initial);
  const [placesDate, setPlacesDate] = useState(dateOf(initial.placesNewUntil));
  const [confirm, setConfirm] = useState(null); // { title, body, action, key, value }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (key, value) => {
    setBusy(true);
    setError('');
    const { data, error: saveError } = await apiRequest('/api/features', { method: 'PATCH', body: { key, value } });
    setBusy(false);
    setConfirm(null);
    if (saveError) return setError(saveError);
    setFeatures(data.data);
    setPlacesDate(dateOf(data.data.placesNewUntil));
    tapHaptic();
    // The header menu reads the switches from the session.
    router.refresh();
  };

  const placesIsNew = new Date().toISOString() < features.placesNewUntil;
  const placesChanged = placesDate && placesDate !== dateOf(features.placesNewUntil);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
      {error && <Alert severity='error'>{error}</Alert>}

      <FeatureCard title='Covers for every driver'>
        <Box component='label' sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: busy ? 'default' : 'pointer' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>Covers for every driver</Typography>
            <Typography variant='body2' color='text.secondary'>
              {features.coversOpen
                ? 'On: every signed-in driver has Covers.'
                : 'Off: only you (super admins) have Covers while it’s tested.'}
            </Typography>
          </Box>
          <Switch
            edge='end'
            checked={features.coversOpen}
            disabled={busy}
            onChange={(event) =>
              setConfirm(
                event.target.checked
                  ? {
                      title: 'Open Covers to every driver?',
                      body:
                        'Every signed-in driver gets /covers and its menu item, can ask to be verified, and sees the check mark on verified drivers’ tips. Go through the rollout checklist in docs/COVER-BIDDING.md first.',
                      action: 'Open Covers',
                      key: 'coversOpen',
                      value: true,
                    }
                  : {
                      title: 'Close Covers to drivers?',
                      body: 'Drivers and admins lose /covers and its menu item on their next request; only super admins keep it. Their lists and claims are kept.',
                      action: 'Close Covers',
                      key: 'coversOpen',
                      value: false,
                    },
              )
            }
          />
        </Box>
        <Changed features={features} featureKey='coversOpen' />
      </FeatureCard>

      <FeatureCard title='Places "New" label'>
        <Box>
          <Typography sx={{ fontWeight: 700 }}>Places &ldquo;New&rdquo; label</Typography>
          <Typography variant='body2' color='text.secondary'>
            {placesIsNew
              ? `The menu says “New” on Places until ${formatDay(features.placesNewUntil)}.`
              : `Ended ${formatDay(features.placesNewUntil)}.`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <TextField
            type='date'
            label='Until'
            value={placesDate}
            onChange={(event) => setPlacesDate(event.target.value)}
            disabled={busy}
            sx={[softInputSx, { flex: '1 1 12rem' }]}
          />
          <Button
            variant='contained'
            disabled={busy || !placesChanged}
            onClick={() => save('placesNewUntil', `${placesDate}T00:00:00.000Z`)}
            sx={[softContainedSx, { px: 3, minHeight: '3rem', alignSelf: 'flex-end' }]}
          >
            Save
          </Button>
          {placesIsNew && (
            <Button
              disabled={busy}
              onClick={() => save('placesNewUntil', new Date().toISOString())}
              sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem', alignSelf: 'flex-end' }]}
            >
              End now
            </Button>
          )}
        </Box>
        <Changed features={features} featureKey='placesNewUntil' />
      </FeatureCard>

      <FeatureCard title='New-icon notice'>
        <Box>
          <Typography sx={{ fontWeight: 700 }}>New-icon notice</Typography>
          <Typography variant='body2' color='text.secondary'>
            Drivers in the installed iPhone app who haven&apos;t dismissed it since{' '}
            {formatWhen(features.iconChangedAt)} are asked to remove and re-add SLICs to get the
            current icon. Ask again after you change the icon.
          </Typography>
        </Box>
        <Box>
          <Button
            disabled={busy}
            onClick={() =>
              setConfirm({
                title: 'Ask about the icon again?',
                body:
                  'Every driver using the installed iPhone app sees the notice on /home again, until they dismiss it. Only do this after the icon changes.',
                action: 'Ask again',
                key: 'iconChangedAt',
                value: 'now',
              })
            }
            sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
          >
            Ask again
          </Button>
        </Box>
        <Changed features={features} featureKey='iconChangedAt' />
      </FeatureCard>

      <Dialog open={Boolean(confirm)} onClose={() => !busy && setConfirm(null)} fullWidth maxWidth='xs'>
        <DialogTitle>{confirm?.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirm?.body}</Typography>
        </DialogContent>
        <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setConfirm(null)}
            disabled={busy}
            sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={() => save(confirm.key, confirm.value)}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={16} color='inherit' /> : null}
            sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
          >
            {confirm?.action}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
