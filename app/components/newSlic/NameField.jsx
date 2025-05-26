import { FormControl, FormLabel, TextField } from '@mui/material';

function NameField({ name, setName }) {
  const handleChange = (event) => {
    setName(event.target.value);
  };

  return (
    <FormControl sx={{ width: '100%', maxWidth: '30rem', mt: '2rem' }}>
      <TextField label='Name' value={name} onChange={handleChange} />
    </FormControl>
  );
}

export default NameField;
