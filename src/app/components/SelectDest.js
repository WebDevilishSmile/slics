import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';

export default function SelectDest({
  slic,
  setSlic,
  checked,
  setChecked,
  init,
  customers,
  centers,
}) {
  function handleSlicSelect(e) {
    setSlic(e.target.value);
  }

  function handleCustomerCheck(e) {
    init();
    setChecked(false);
  }
  function handleCenterCheck(e) {
    init();
    setChecked(true);
  }

  function handleCheckChange(e) {
    init();
    setChecked(e.target.checked);
  }

  const locationMenuItems = customers.map(function (cus, index) {
    return (
      <MenuItem key={index} value={cus.numSlic}>
        {cus.numSlic}
      </MenuItem>
    );
  });

  const upsCenterMenuItems = centers.map(function (center, index) {
    return (
      <MenuItem key={index} value={center.numSlic}>
        {center.numSlic} -- ({center.alphaSlic})
      </MenuItem>
    );
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Box /* SELECTION */
        id='selection'
        sx={{ width: { xs: '90%', sm: '90%', md: '35rem' }, mt: '1rem' }}
      >
        <FormControl fullWidth>
          <InputLabel>SLIC</InputLabel>

          <Select label='SLIC' value={slic} onChange={handleSlicSelect}>
            {checked ? upsCenterMenuItems : locationMenuItems}
          </Select>
        </FormControl>
      </Box>

      <Box /* SWITCH CUSTOMERS UPS CENTERS */>
        <Stack direction='row' spacing={1} alignItems='center'>
          <Typography onClick={handleCustomerCheck} sx={{ cursor: 'pointer' }}>
            Customers
          </Typography>
          <Switch checked={checked} onChange={handleCheckChange} />
          <Typography onClick={handleCenterCheck} sx={{ cursor: 'pointer' }}>
            UPS Centers
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
