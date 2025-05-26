import { FormControl, TextField } from '@mui/material';

function AlphaSlicField({ alphaSlic, setAlphaSlic }) {
  const handleChange = (event) => {
    setAlphaSlic(event.target.value);
  };

  return (
    <FormControl sx={{ width: '100%', maxWidth: '30rem', mt: '2rem' }}>
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
