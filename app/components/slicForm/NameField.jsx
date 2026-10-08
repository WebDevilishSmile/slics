import theme from '@/utils/theme';
import { capitalizeWords } from '@/lib/format';
import { FormControl, TextField } from '@mui/material';
import { softInputSx } from '../utility/soft';

function NameField({ name, setName }) {
  const handleChange = (event) => {
    const inputValue = event.target.value;
    const capitalizedValue = capitalizeWords(inputValue);
    setName(capitalizedValue);
  };

  return (
    <FormControl sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 4 }}>
      <TextField label='Name' value={name} onChange={handleChange} sx={softInputSx} />
    </FormControl>
  );
}

export default NameField;
