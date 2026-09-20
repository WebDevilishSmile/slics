import theme from '@/utils/theme';
import { capitalizeWords } from '@/utils/functions';
import { FormControl, FormLabel, TextField } from '@mui/material';

function NameField({ name, setName }) {
  const handleChange = (event) => {
    const inputValue = event.target.value;
    const capitalizedValue = capitalizeWords(inputValue);
    setName(capitalizedValue);
  };

  return (
    <FormControl sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 4 }}>
      <TextField label='Name' value={name} onChange={handleChange} />
    </FormControl>
  );
}

export default NameField;
