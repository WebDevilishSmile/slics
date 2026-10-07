'use client';

import { useMemo } from 'react';
import { Autocomplete, TextField, createFilterOptions } from '@mui/material';

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
// silently dropped on the next save.
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
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={placeholder} />
      )}
    />
  );
}

export default SlicTagsField;
