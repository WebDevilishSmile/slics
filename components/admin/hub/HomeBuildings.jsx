'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import HomeBasePicker from '@/components/homeBase/HomeBasePicker';
import BottomSheetDialog, { BottomSheetActions } from '@/components/utility/BottomSheetDialog';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '@/components/utility/soft';

const SOURCE_TEXT = { sheet: 'sheet', staff: 'staff', asked: 'answered', admin: 'set by an admin', unknown: 'other' };
const buttonSx = [softRaisedSmall, softPressSx, { px: 2, minHeight: '2.75rem' }];
const capsSx = [softInputSx, { '& input': { textTransform: 'uppercase' } }];
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// "Allentown, PA" → { city: 'Allentown', state: 'PA' }.
function splitPlace(place = '') {
  const match = /^(.*),\s*([A-Za-z]{2})$/.exec(place.trim());
  return match ? { city: match[1], state: match[2].toUpperCase() } : { city: place, state: '' };
}

// Add to All Hubs: the building as /hubs will show it, filled in from what
// drivers typed and corrected by the super admin.
function AddHubDialog({ building, onClose, onDone }) {
  const [fields, setFields] = useState(() => ({
    numSlic: building.numSlic,
    alphaSlic: building.alphaSlic,
    street: '',
    ...splitPlace(building.places[0]),
    zip: '',
    phone: '',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const field = (key, label, extra = {}) => (
    <TextField
      label={label}
      value={fields[key]}
      onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.value }))}
      sx={softInputSx}
      fullWidth
      {...extra}
    />
  );

  const save = async () => {
    setBusy(true);
    setError('');
    const { error: saveError } = await apiRequest(`/api/home-buildings/${building.key}`, { body: fields });
    setBusy(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    onDone(`${fields.alphaSlic.toUpperCase()} ${fields.numSlic} is on the All Hubs list.`);
  };

  return (
    <BottomSheetDialog open onClose={busy ? undefined : onClose} aria-labelledby='add-hub-title'>
      <DialogTitle id='add-hub-title'>Add to All Hubs</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <DialogContentText>
          It shows on /hubs for every driver, and the drivers who gave it move to it. Check it first.
        </DialogContentText>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {field('numSlic', 'SLIC number', { sx: capsSx })}
          {field('alphaSlic', 'Alpha code', { sx: capsSx })}
        </Box>
        {field('street', 'Street', { placeholder: '1620 Van Buren Rd' })}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {field('city', 'City', { sx: [softInputSx, { flex: 2 }] })}
          {field('state', 'State', { sx: [...capsSx, { flex: 1 }], slotProps: { htmlInput: { maxLength: 2 } } })}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {field('zip', 'ZIP', { slotProps: { htmlInput: { inputMode: 'numeric', maxLength: 5 } } })}
          {field('phone', 'Phone (optional)', { slotProps: { htmlInput: { inputMode: 'tel' } } })}
        </Box>
        {error && <Alert severity='error'>{error}</Alert>}
      </DialogContent>
      <BottomSheetActions>
        <Button variant='contained' size='large' onClick={save} disabled={busy} sx={softContainedSx}>
          {busy ? 'Adding…' : 'Add to All Hubs'}
        </Button>
        <Button size='large' onClick={onClose} disabled={busy} sx={[softRaisedSmall, softPressSx]}>
          Cancel
        </Button>
      </BottomSheetActions>
    </BottomSheetDialog>
  );
}

// Not a hub, confirmed: its drivers are asked again on /home.
function DismissDialog({ building, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dismiss = async () => {
    setBusy(true);
    const { error: saveError } = await apiRequest(`/api/home-buildings/${building.key}`, { method: 'DELETE' });
    setBusy(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    onDone(`${building.alphaSlic} ${building.numSlic} cleared.`);
  };
  return (
    <BottomSheetDialog open onClose={busy ? undefined : onClose} aria-labelledby='dismiss-hub-title'>
      <DialogTitle id='dismiss-hub-title'>
        {building.alphaSlic} {building.numSlic} isn&apos;t a hub?
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          The {plural(building.accounts + building.requests, 'driver')} who gave it lose it, and the card on /home asks them
          again.
        </DialogContentText>
        {error && <Alert severity='error' sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button onClick={onClose} disabled={busy} sx={[softRaisedSmall, softPressSx, { minHeight: '3rem', px: 2 }]}>
          Cancel
        </Button>
        <Button variant='contained' onClick={dismiss} disabled={busy} sx={[softContainedSx, { minHeight: '3rem' }]}>
          {busy ? 'Clearing…' : 'Not a hub'}
        </Button>
      </DialogActions>
    </BottomSheetDialog>
  );
}

// The super admin hub's Home buildings (docs/MULTI-HUB.md "Home base", step
// 4): where accounts say they work out of, by building and source, with Not
// answered last, and the buildings drivers typed in that the All Hubs list
// doesn't have, each with Add to All Hubs, Same as… (the driver's picker,
// pointed at /api/home-buildings/[key]) and Not a hub. Counts only, never who.
// `summary` is getHomeBaseSummary (lib/db/homeBase.js).
export default function HomeBuildings({ summary }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dialog, setDialog] = useState(null); // { kind: 'add' | 'same' | 'dismiss', building }
  const [announcement, setAnnouncement] = useState('');

  const done = (message) => {
    setDialog(null);
    setAnnouncement(message);
    tapHaptic();
    startTransition(() => router.refresh());
  };

  const sources = (bySource) =>
    Object.entries(bySource)
      .map(([source, count]) => `${count} ${SOURCE_TEXT[source] ?? source}`)
      .join(', ');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box
        component='ul'
        sx={[softInset, { listStyle: 'none', m: 0, p: 2, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }]}
      >
        {summary.buildings.map((building) => (
          <Box component='li' key={building.label} sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }}>{building.label}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {sources(building.bySource)}
                {!building.listed && ' · not on the list'}
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 700 }}>{building.count}</Typography>
          </Box>
        ))}
        <Box component='li' sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
          <Typography sx={{ flex: 1 }} color='text.secondary'>
            Not answered
          </Typography>
          <Typography sx={{ fontWeight: 700 }} color='text.secondary'>
            {summary.notAnswered}
          </Typography>
        </Box>
      </Box>
      <Typography variant='body2' color='text.secondary'>
        {plural(summary.total, 'account')}
        {summary.requests > 0 && ` · ${plural(summary.requests, 'change')} waiting for an admin (on each user's page)`}
      </Typography>

      {summary.typed.length > 0 && (
        <Box component='section' aria-labelledby='typed-buildings'>
          <Typography id='typed-buildings' variant='subtitle1' component='h4' sx={{ fontWeight: 700, mb: 0.5 }}>
            Added by drivers
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
            Buildings that aren&apos;t on the All Hubs list. Look each one up, then add it, point it at the one it
            is, or clear it.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {summary.typed.map((building) => (
              <Box key={building.key} sx={[softRaised, { borderRadius: 4, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }]}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>
                    {building.alphaSlic} {building.numSlic}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {building.places.join(' · ') || 'No city given'} · {plural(building.accounts, 'driver')}
                    {building.requests > 0 && `, ${building.requests} asking`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  <Button onClick={() => setDialog({ kind: 'add', building })} aria-haspopup='dialog' sx={buttonSx}>
                    Add to All Hubs
                  </Button>
                  <Button onClick={() => setDialog({ kind: 'same', building })} aria-haspopup='dialog' sx={buttonSx}>
                    Same as…
                  </Button>
                  <Button onClick={() => setDialog({ kind: 'dismiss', building })} aria-haspopup='dialog' sx={buttonSx}>
                    Not a hub
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box component='span' role='status' aria-live='polite' sx={visuallyHidden}>
        {announcement}
      </Box>

      {dialog?.kind === 'add' && (
        <AddHubDialog building={dialog.building} onClose={() => setDialog(null)} onDone={done} />
      )}
      {dialog?.kind === 'dismiss' && (
        <DismissDialog building={dialog.building} onClose={() => setDialog(null)} onDone={done} />
      )}
      <HomeBasePicker
        open={dialog?.kind === 'same'}
        onClose={() => setDialog(null)}
        onSaved={() => done(`${dialog.building.alphaSlic} ${dialog.building.numSlic} moved.`)}
        endpoint={dialog?.kind === 'same' ? `/api/home-buildings/${dialog.building.key}` : undefined}
        title={dialog?.kind === 'same' ? `Which listed building is ${dialog.building.alphaSlic} ${dialog.building.numSlic}?` : ''}
        description='Its drivers move to the one you pick.'
        saveLabel='Move them'
      />
    </Box>
  );
}
