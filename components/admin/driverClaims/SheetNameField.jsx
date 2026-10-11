'use client';

import { useMemo } from 'react';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';

import { driverNameKey, rankSheetNames } from '@/lib/driverNames';
import { softInputSx, softRaised } from '@/components/utility/soft';

// The dropdown as a raised card, like SlicTagsField's.
const softListSx = [
  softRaised,
  { mt: 1, borderRadius: 4, '& .MuiAutocomplete-option': { minHeight: '3rem' } },
];

// The driver's name as the on-call sheet spells it, for verifying an account
// (docs/COVER-BIDDING.md). `names` come from getClaimableDriverNames: the
// names most like `claimedName` are listed first, and a name linked to another
// account can't be picked (`userId` is the account being verified). Typing a
// name that isn't on a sheet is allowed, with a warning: their week tiles stay
// empty until the sheet lists it.
export default function SheetNameField({ names, value, onChange, claimedName, userId, disabled }) {
  const byKey = useMemo(
    () => new Map(names.map((entry) => [driverNameKey(entry.name), entry])),
    [names],
  );
  const options = useMemo(() => {
    const ranked = rankSheetNames(claimedName ?? '', names.map((entry) => entry.name));
    const rest = names.map((entry) => entry.name).filter((name) => !ranked.includes(name));
    return [...ranked, ...rest];
  }, [names, claimedName]);

  const takenBy = (name) => {
    const holder = byKey.get(driverNameKey(name))?.linkedTo;
    return holder && holder._id !== userId ? holder : null;
  };
  const known = byKey.has(driverNameKey(value));
  const taken = takenBy(value);

  return (
    <Autocomplete
      freeSolo
      options={options}
      inputValue={value}
      onInputChange={(event, next) => onChange(next)}
      getOptionDisabled={(name) => Boolean(takenBy(name))}
      disabled={disabled}
      slotProps={{ paper: { sx: softListSx } }}
      renderOption={({ key, ...props }, name) => {
        const entry = byKey.get(driverNameKey(name));
        const holder = takenBy(name);
        return (
          <Box component='li' key={key} {...props}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='body2' sx={{ fontWeight: 600 }}>
                {name}
              </Typography>
              <Typography variant='caption' color='text.secondary' component='p'>
                {holder ? `Linked to ${holder.name || 'another account'}` : entry?.sources.join(' · ')}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label='Name on the sheet'
          placeholder='LAST, FIRST'
          sx={softInputSx}
          error={Boolean(taken)}
          helperText={
            taken
              ? `Already linked to ${taken.name || 'another account'}.`
              : value.trim() && !known
                ? "Not on a sheet in the last 8 weeks. Their weeks stay empty until it is."
                : 'As the on-call sheet spells it'
          }
        />
      )}
    />
  );
}
