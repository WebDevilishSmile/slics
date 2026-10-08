import theme from '@/utils/theme';
import { formatPhoneNumber } from '@/lib/format';
import { FormControl, TextField } from '@mui/material';

// `sx` merges over the slic form's column defaults (e.g. `{ mt: 0 }` inside a
// dialog that spaces its fields with `gap`). It can be an sx array, and it
// reaches the field inside (e.g. `softInputSx` from utility/soft.js).
function PhoneField({ phone, setPhone, sx, disabled }) {
  const handleChange = (event) => {
    const rawValue = event.target.value;
    const formatted = formatPhoneNumber(rawValue);
    setPhone(formatted);
  };

  return (
    <FormControl
      sx={[
        { width: '100%', maxWidth: theme.layout.width.field, mt: 4 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
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
