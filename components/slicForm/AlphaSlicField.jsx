import theme from '@/theme';
import { FormControl, TextField } from '@mui/material';
import { softInputSx } from '@/components/utility/soft';

function AlphaSlicField({ alphaSlic, setAlphaSlic }) {
  const handleChange = (event) => {
    setAlphaSlic(event.target.value.toUpperCase());
  };

  return (
    <FormControl sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 4 }}>
      <TextField
        required
        label='Alpha code'
        sx={softInputSx}
        value={alphaSlic}
        onChange={handleChange}
      />
    </FormControl>
  );
}

export default AlphaSlicField;
