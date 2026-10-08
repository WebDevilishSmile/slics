'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import { isDayTime } from '@/lib/dayFormat';
import { softInputSx } from '@/components/utility/soft';

const toDayjs = (value) =>
  value && isDayTime(value) ? dayjs(`2000-01-01T${value}`) : null;

// A bid sheet's day cell: a 24-hour time typed the way the sheet prints it
// ("0630" fills in 06:30), kept on the row as "HH:MM", or '' when blank.
//
// The field works on a dayjs value and the row holds the string. A half-typed
// time ("06:mm") stays in the field without reaching the row, and goes back to
// the row's value when focus leaves, so what shows is always what saves. A
// value that isn't a time at all (a misread the extraction couldn't tidy)
// shows as an error, with what was read, until a time replaces it.
export default function DayTimeField({ value = '', onChange, sx, helperText, ...props }) {
  const [draft, setDraft] = useState(() => toDayjs(value));
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    setShown(value);
    setDraft(toDayjs(value));
  }

  const unreadable = !isDayTime(value);

  return (
    <TimeField
      {...props}
      value={draft}
      onChange={(next) => {
        setDraft(next);
        if (next === null) onChange('');
        else if (next.isValid()) onChange(next.format('HH:mm'));
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        if (draft && !draft.isValid()) setDraft(toDayjs(value));
      }}
      ampm={false}
      format='HH:mm'
      error={unreadable || undefined}
      helperText={unreadable ? `Read as "${value}"` : helperText}
      sx={[
        softInputSx,
        // MUI X sizes the time like a native input (182px); size it to "HH:MM".
        { '& .MuiPickersInputBase-sectionsContainer': { width: 'auto' } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
