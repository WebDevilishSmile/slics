import theme from '@/utils/theme';
import { FormControl, TextField } from '@mui/material';

function AlphaSlicField({ alphaSlic, setAlphaSlic }) {
  const handleChange = (event) => {
    setAlphaSlic(event.target.value.toUpperCase());
  };

  return (
    <FormControl sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 4 }}>
      <TextField
        required
        label='AlphaSlic'
        value={alphaSlic}
        onChange={handleChange}
      />
    </FormControl>
  );
}

export default AlphaSlicField;
