import theme from '@/theme';
import { capitalizeWords } from '@/lib/format';
import { FormControl, TextField } from '@mui/material';
import { softInputSx } from '@/components/utility/soft';

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
      sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 4, gap: 4 }}
    >
      <TextField
        required
        autoFocus
        label='Street'
        sx={softInputSx}
        value={address.street || ''}
        onChange={handleStreetChange}
      />
      <TextField
        required
        autoFocus
        label='City'
        sx={softInputSx}
        value={address.city || ''}
        onChange={handleCityChange}
      />
      <TextField
        required
        autoFocus
        label='State'
        sx={softInputSx}
        value={address.state || ''}
        onChange={handleStateChange}
      />
      <TextField
        required
        autoFocus
        label='Zip'
        sx={softInputSx}
        value={address.zip || ''}
        onChange={handleZipChange}
      />
    </FormControl>
  );
}

export default AddressFields;
