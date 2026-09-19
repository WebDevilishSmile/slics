import { capitalizeWords } from '@/utils/functions';
import { FormControl, TextField } from '@mui/material';

function AddressFields({ address, setAddress }) {
  const handleStreetChange = (event) => {
    const inputValue = event.target.value;
    // Ensure the street is capitalized
    const capitalizedValue = capitalizeWords(inputValue);
    setAddress((prev) => ({ ...prev, street: capitalizedValue }));
  };
  const handleCityChange = (event) => {
    const inputValue = event.target.value;
    const capitalizedValue = capitalizeWords(inputValue);
    setAddress((prev) => ({ ...prev, city: capitalizedValue }));
  };
  const handleStateChange = (event) => {
    setAddress((prev) => ({
      ...prev,
      state: event.target.value.toUpperCase(),
    }));
  };
  const handleZipChange = (event) => {
    setAddress((prev) => ({
      ...prev,
      zip: event.target.value.toUpperCase(),
    }));
  };
  return (
    <FormControl
      sx={{ width: '100%', maxWidth: '30rem', mt: '2rem', gap: '2rem' }}
    >
      <TextField
        required
        autoFocus
        label='Street'
        value={address.street || ''}
        onChange={handleStreetChange}
      />
      <TextField
        required
        autoFocus
        label='City'
        value={address.city || ''}
        onChange={handleCityChange}
      />
      <TextField
        required
        autoFocus
        label='State'
        value={address.state || ''}
        onChange={handleStateChange}
      />
      <TextField
        required
        autoFocus
        label='Zip'
        value={address.zip || ''}
        onChange={handleZipChange}
      />
    </FormControl>
  );
}

export default AddressFields;
