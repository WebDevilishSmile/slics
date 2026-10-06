import theme from '@/utils/theme';
import { formatPhoneNumber } from '@/utils/functions';
import { FormControl, FormLabel, TextField } from '@mui/material';

// `sx` merges over the slic form's column defaults (e.g. `{ mt: 0 }` inside a
// dialog that spaces its fields with `gap`).
function PhoneField({ phone, setPhone, sx, disabled }) {
  const handleChange = (event) => {
    const rawValue = event.target.value;
    const formatted = formatPhoneNumber(rawValue);
    setPhone(formatted);
  };

  return (
    <FormControl
      sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 4, ...sx }}
    >
      <TextField
        label='Phone'
        value={phone}
        onChange={handleChange}
        disabled={disabled}
      />
    </FormControl>
  );
}

export default PhoneField;
