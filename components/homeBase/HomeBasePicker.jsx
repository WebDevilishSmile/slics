'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
  TextField,
  Typography,
  createFilterOptions,
} from '@mui/material';

import { HOME_BASE_CITY_MAX_LENGTH, hubTown, parseNumSlic } from '@/lib/homeBase';
import { tapHaptic } from '@/lib/haptics';
import BottomSheetDialog, { BottomSheetActions } from '@/components/utility/BottomSheetDialog';
import { softContainedSx, softInputSx, softPressSx, softRaised, softRaisedSmall } from '@/components/utility/soft';

// The All Hubs list, fetched once per page load: it's the same for everyone
// and changes only when the super admin adds a building.
let hubsRequest = null;
function loadHubs() {
  hubsRequest ??= fetch('/api/all-hubs')
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't load the buildings.");
      return data.hubs ?? [];
    })
    .catch((error) => {
      hubsRequest = null; // try again next time it opens
      throw error;
    });
  return hubsRequest;
}

const hubLabel = (hub) => `${hub.alphaSlic} ${hub.numSlic}`;

// Typing matches the alpha code, the number or the town.
const filterOptions = createFilterOptions({
  stringify: (hub) => `${hub.alphaSlic} ${hub.numSlic} ${hub.town}`,
  limit: 50,
});

// The dropdown as a raised card, with roomy rows for a thumb (like
// form/SlicTagsField.jsx).
const listSx = [softRaised, { mt: 1, borderRadius: 4, '& .MuiAutocomplete-option': { minHeight: '3rem' } }];

const EMPTY_TYPED = { numSlic: '', alphaSlic: '', city: '', state: '' };

// Codes show in capitals as they're typed; the server uppercases them too.
const capsSx = [softInputSx, { '& input': { textTransform: 'uppercase' } }];

// Saves a pick with a PUT to `endpoint` and returns what the route answers:
// `{ homeBase }`, `{ request }` (a verified driver's or staff's, waiting for an
// admin) or, from an admin's save, `{ homeBase, homeBaseRequest }`. With
// `preview` (the super admin's Notes, where their own building is fixed)
// nothing is sent: it answers as the driver's route would, from the list.
// Throws with the message to show.
export const MY_HOME_BASE_URL = '/api/users/me/home-base';
export async function putHomeBase(body, { preview = false, hubs = [], endpoint = MY_HOME_BASE_URL } = {}) {
  if (preview) {
    const numSlic = String(body.numSlic).trim().toUpperCase();
    const alphaSlic = String(body.alphaSlic).trim().toUpperCase();
    const hub = hubs.find((choice) => choice.numSlic === numSlic && choice.alphaSlic === alphaSlic);
    const name = hub ? hub.town : hubTown(body.city, body.state);
    return { homeBase: { numSlic, alphaSlic, name, source: 'asked', listed: Boolean(hub) } };
  }
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Couldn't save the building. Please try again.");
  return data;
}

// Which building a driver works out of (docs/MULTI-HUB.md "Home base", step
// 3): a search over the All Hubs list, and "My building isn't here" for one
// it doesn't have (the SLIC number, the alpha code, the city and the state:
// enough for the super admin to find the building). A
// typed number the list has offers that building first, so a typo or a
// missed search ends on the listed one. Saves through putHomeBase and hands
// the route's answer to `onSaved`; `preview` saves nothing. An admin's page
// passes its own `endpoint`, `title` and `description` (null for none).
export default function HomeBasePicker({
  open,
  onClose,
  onSaved,
  preview = false,
  endpoint = MY_HOME_BASE_URL,
  title = 'Which building do you work out of?',
  description = "So SLICs can show your building's routes when other hubs join.",
  saveLabel = 'Save',
}) {
  const [hubs, setHubs] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [picked, setPicked] = useState(null);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState(EMPTY_TYPED);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setPicked(null);
    setTyping(false);
    setTyped(EMPTY_TYPED);
    setError('');
    setLoadError('');
    let live = true;
    loadHubs()
      .then((list) => live && setHubs(list))
      .catch((loadFailure) => live && setLoadError(loadFailure.message));
    return () => {
      live = false;
    };
  }, [open]);

  // Listed buildings with the number typed so far, once it's a whole one.
  const typedNumSlic = parseNumSlic(typed.numSlic);
  const suggestions = useMemo(
    () => (typedNumSlic && hubs ? hubs.filter((hub) => hub.numSlic === typedNumSlic) : []),
    [typedNumSlic, hubs],
  );
  const suggestionTaken = suggestions.some((hub) => hub.alphaSlic === typed.alphaSlic.trim().toUpperCase());

  const canSave = typing
    ? typed.numSlic.trim() && typed.alphaSlic.trim() && ((typed.city.trim() && typed.state.trim().length === 2) || suggestionTaken)
    : Boolean(picked);

  const save = async () => {
    const body = typing
      ? { numSlic: typed.numSlic, alphaSlic: typed.alphaSlic, city: typed.city, state: typed.state }
      : { numSlic: picked.numSlic, alphaSlic: picked.alphaSlic };
    setSaving(true);
    setError('');
    try {
      const saved = await putHomeBase(body, { preview, hubs: hubs ?? [], endpoint });
      tapHaptic();
      onSaved(saved);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const chooseSuggestion = (hub) => {
    setPicked(hub);
    setTyping(false);
    setTyped(EMPTY_TYPED);
  };

  const field = (key) => ({
    value: typed[key],
    onChange: (event) => setTyped((current) => ({ ...current, [key]: event.target.value })),
    sx: softInputSx,
    fullWidth: true,
  });

  return (
    <BottomSheetDialog open={open} onClose={saving ? undefined : onClose} aria-labelledby='home-base-title'>
      <DialogTitle id='home-base-title'>{title}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {description && <DialogContentText>{description}</DialogContentText>}

        {loadError && <Alert severity='error'>{loadError}</Alert>}

        {!typing && (
          <>
            {hubs ? (
              <Autocomplete
                options={hubs}
                value={picked}
                onChange={(event, next) => setPicked(next)}
                getOptionLabel={hubLabel}
                getOptionKey={(hub) => `${hub.alphaSlic}:${hub.numSlic}`}
                isOptionEqualToValue={(option, current) =>
                  option.numSlic === current.numSlic && option.alphaSlic === current.alphaSlic
                }
                filterOptions={filterOptions}
                renderOption={({ key, ...props }, hub) => (
                  <li key={key} {...props}>
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{hubLabel(hub)}</Typography>
                      {hub.town && (
                        <Typography variant='body2' color='text.secondary'>
                          {hub.town}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
                slotProps={{ paper: { sx: listSx } }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Building'
                    placeholder='Alpha code, number or town'
                    helperText={picked?.town || ' '}
                    sx={softInputSx}
                  />
                )}
              />
            ) : (
              !loadError && <Skeleton variant='rounded' height={56} sx={{ borderRadius: 4 }} />
            )}
            <Button
              onClick={() => {
                setPicked(null);
                setTyping(true);
              }}
              sx={[softRaisedSmall, softPressSx, { alignSelf: 'flex-start', px: 2, minHeight: '2.75rem' }]}
            >
              My building isn&apos;t here
            </Button>
          </>
        )}

        {typing && (
          <>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                {...field('numSlic')}
                label='SLIC number'
                sx={capsSx}
                slotProps={{ htmlInput: { maxLength: 5, autoCapitalize: 'characters', autoComplete: 'off', spellCheck: false } }}
              />
              <TextField
                {...field('alphaSlic')}
                label='Alpha code'
                sx={capsSx}
                slotProps={{
                  htmlInput: { maxLength: 7, autoCapitalize: 'characters', autoComplete: 'off', spellCheck: false },
                }}
              />
            </Box>

            {suggestions.length > 0 && !suggestionTaken && (
              <Box sx={[softRaised, { borderRadius: 4, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }]}>
                <Typography variant='body2'>
                  {suggestions.length === 1 ? 'That number is on the list. Is it this one?' : 'That number is on the list twice:'}
                </Typography>
                {suggestions.map((hub) => (
                  <Button
                    key={hub.alphaSlic}
                    onClick={() => chooseSuggestion(hub)}
                    sx={[softRaisedSmall, softPressSx, { justifyContent: 'flex-start', px: 2, minHeight: '3rem', textAlign: 'left' }]}
                  >
                    {hubLabel(hub)}
                    {hub.town ? ` · ${hub.town}` : ''}
                  </Button>
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                {...field('city')}
                label='City'
                placeholder='Allentown'
                sx={[softInputSx, { flex: 2 }]}
                slotProps={{ htmlInput: { maxLength: HOME_BASE_CITY_MAX_LENGTH, autoComplete: 'off' } }}
              />
              <TextField
                {...field('state')}
                label='State'
                placeholder='PA'
                sx={[...capsSx, { flex: 1 }]}
                slotProps={{
                  htmlInput: { maxLength: 2, autoCapitalize: 'characters', autoComplete: 'off', spellCheck: false },
                }}
              />
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ mt: -1.5 }}>
              We check it, then add it to the list.
            </Typography>
            <Button
              onClick={() => setTyping(false)}
              sx={[softRaisedSmall, softPressSx, { alignSelf: 'flex-start', px: 2, minHeight: '2.75rem' }]}
            >
              Search the list instead
            </Button>
          </>
        )}

        {error && <Alert severity='error'>{error}</Alert>}
      </DialogContent>
      <BottomSheetActions>
        <Button
          variant='contained'
          size='large'
          onClick={save}
          disabled={!canSave || saving}
          sx={softContainedSx}
        >
          {saving ? 'Saving…' : saveLabel}
        </Button>
        <Button size='large' onClick={onClose} disabled={saving} sx={[softRaisedSmall, softPressSx]}>
          Cancel
        </Button>
      </BottomSheetActions>
    </BottomSheetDialog>
  );
}
