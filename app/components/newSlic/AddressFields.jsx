import { FormControl, FormLabel, TextField } from '@mui/material';

function AddressFields({ address, setAddress }) {
  const handleStreetChange = (event) => {
    setAddress((prev) => ({ ...prev, street: event.target.value }));
  };
  const handleCityChange = (event) => {
    setAddress((prev) => ({ ...prev, city: event.target.value }));
  };
  const handleStateChange = (event) => {
    setAddress((prev) => ({ ...prev, state: event.target.value }));
  };
  const handleZipChange = (event) => {
    setAddress((prev) => ({ ...prev, zip: event.target.value }));
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
