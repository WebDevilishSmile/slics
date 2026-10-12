'use client';

import { useState } from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField } from '@mui/material';

import { softInputSx, softPressSx } from '@/components/utility/soft';

// A soft password field with a show/hide button, so a driver can check what
// they typed on a phone instead of typing it twice. The eye is filled while
// the password shows, and `aria-pressed` says the same. Other TextField props
// (label, autoComplete, error, helperText…) pass through; `htmlInput` is
// merged with any `slotProps.htmlInput` given.
export default function PasswordField({ slotProps, ...props }) {
  const [show, setShow] = useState(false);

  return (
    <TextField
      type={show ? 'text' : 'password'}
      fullWidth
      sx={softInputSx}
      {...props}
      slotProps={{
        ...slotProps,
        htmlInput: {
          autoCapitalize: 'none',
          autoCorrect: 'off',
          spellCheck: false,
          ...slotProps?.htmlInput,
        },
        input: {
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                onClick={() => setShow((value) => !value)}
                aria-label={show ? 'Hide password' : 'Show password'}
                aria-pressed={show}
                edge='end'
                sx={softPressSx}
              >
                {show ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
