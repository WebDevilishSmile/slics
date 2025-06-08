import { FormControl, FormLabel, TextField } from '@mui/material';

function NumSlicField({ numSlic, setNumSlic }) {
  const handleChange = (event) => {
    setNumSlic(event.target.value.toUpperCase());
  };

  return (
    <FormControl sx={{ width: '100%', maxWidth: '30rem', mt: '2rem' }}>
      <TextField
        required
        autoFocus
        label='NumSlic'
        value={numSlic}
        onChange={handleChange}
      />
    </FormControl>
  );
}

export default NumSlicField;
