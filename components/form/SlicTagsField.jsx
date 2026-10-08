'use client';

import { useMemo } from 'react';
import { Autocomplete, TextField, createFilterOptions } from '@mui/material';

import { softInputSx, softRaised, softRaisedSmall } from '@/components/utility/soft';

// Picked SLICs are small raised pills inside the well.
const softTagsSx = (theme) => ({
  '& .MuiAutocomplete-tag': softRaisedSmall(theme),
});

// The dropdown as a raised card on the page surface, with roomy rows for a
// thumb, like the SLIC search on /home. (The themed MuiPopover doesn't reach
// an Autocomplete's own Paper.)
const softListSx = [
  softRaised,
  { mt: 1, borderRadius: 4, '& .MuiAutocomplete-option': { minHeight: '3rem' } },
];

// "1809 - BETPA · Bethlehem Center"; parts that are missing are skipped.
export function slicLabel(slic) {
  const code = slic.alphaSlic
    ? `${slic.numSlic} - ${slic.alphaSlic}`
    : slic.numSlic;
  return slic.name ? `${code} · ${slic.name}` : code;
}

// Typing matches the number, the alpha code or the name.
const filterOptions = createFilterOptions({
  stringify: (slic) => `${slic.numSlic} ${slic.alphaSlic} ${slic.name}`,
});

// Multi-select of SLICs; `value` and `onChange` deal in numSlic strings. A tag
// whose SLIC has since been deleted still shows (by number) instead of being
// silently dropped on the next save. It's drawn as a pressed-in well with
// raised tags (utility/soft.js), so the label sits above the well.
function SlicTagsField({ slics, value, onChange, label, placeholder, disabled }) {
  const byNumSlic = useMemo(
    () => new Map(slics.map((slic) => [slic.numSlic, slic])),
    [slics],
  );
  const selected = value.map(
    (numSlic) => byNumSlic.get(numSlic) ?? { numSlic, alphaSlic: '', name: '' },
  );

  return (
    <Autocomplete
      multiple
      options={slics}
      value={selected}
      onChange={(event, next) => onChange(next.map((slic) => slic.numSlic))}
      getOptionLabel={slicLabel}
      getOptionKey={(slic) => slic.numSlic}
      isOptionEqualToValue={(option, current) =>
        option.numSlic === current.numSlic
      }
      filterOptions={filterOptions}
      filterSelectedOptions
      disabled={disabled}
      slotProps={{ paper: { sx: softListSx } }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          sx={[softInputSx, softTagsSx]}
        />
      )}
    />
  );
}

export default SlicTagsField;
