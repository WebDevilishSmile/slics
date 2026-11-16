'use client';

import { CloseRounded } from '@mui/icons-material';
import { Box, Button, TextField } from '@mui/material';

import { formatPhoneTyping, readPhoneField } from '@/lib/phoneText';
import { softInputSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';

// The phone box under a new tip ("Add phone", comments/CommentComposer.jsx):
// a US number, formatted (***) ***-**** as it's typed (formatPhoneTyping), the
// number pad on a phone, and Remove phone. Until it's all 10 digits of a real
// number it says so, and the composer won't post (readPhoneField). On post the
// number goes on its own line at the end of the tip, where it shows as a
// button that calls it. Soft style like form/PinField.jsx: the label above a
// pressed-in well, a raised pill below.
export default function TipPhoneField({ value, onChange, onRemove, disabled = false }) {
  const { error } = readPhoneField(value);
  // Half typed, it says what's missing in grey; red only once all 10 digits
  // are in and it still isn't a real number, so it doesn't scold mid-typing.
  const whole = value.replace(/\D/g, '').length >= 10;
  const showError = Boolean(error) && whole;
  const help = error && !whole ? 'Type all 10 digits.' : 'Drivers can tap it to call.';

  return (
    <Box>
      <TextField
        sx={softInputSx}
        label='Phone number'
        value={value}
        onChange={(event) => onChange(formatPhoneTyping(event.target.value))}
        placeholder='(610) 555-0134'
        error={showError}
        helperText={showError ? error : help}
        disabled={disabled}
        autoFocus
        fullWidth
        slotProps={{ htmlInput: { inputMode: 'tel', autoComplete: 'off', maxLength: 14 } }}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
        <Button
          size='small'
          onClick={onRemove}
          disabled={disabled}
          startIcon={<CloseRounded />}
          sx={[softRaisedSmall, softPressSx, { px: 1.5, minHeight: '2.5rem' }]}
        >
          Remove phone
        </Button>
      </Box>
    </Box>
  );
}
