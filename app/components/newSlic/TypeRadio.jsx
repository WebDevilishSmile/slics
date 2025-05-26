import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';

function TypeRadio({ type, setType }) {
  const handleChange = (event) => {
    setType(event.target.value);
  };

  return (
    <FormControl>
      <FormLabel>SLIC Type</FormLabel>
      <RadioGroup
        row
        defaultValue='center'
        value={type}
        onChange={handleChange}
      >
        <FormControlLabel value='center' control={<Radio />} label='Center' />
        <FormControlLabel
          value='customer'
          control={<Radio />}
          label='Customer'
        />
      </RadioGroup>
    </FormControl>
  );
}

export default TypeRadio;
