import theme from '@/utils/theme';
import { formatPhoneNumber } from '@/utils/functions';
import { FormControl, FormLabel, TextField } from '@mui/material';

function PhoneField({ phone, setPhone }) {
  const handleChange = (event) => {
    const rawValue = event.target.value;
    const formatted = formatPhoneNumber(rawValue);
    setPhone(formatted);
  };

  return (
    <FormControl sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 4 }}>
      <TextField label='Phone' value={phone} onChange={handleChange} />
    </FormControl>
  );
}

export default PhoneField;
