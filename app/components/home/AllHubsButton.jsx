import { Box, Button, Typography } from '@mui/material';

function AllHubsButton() {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        mt: 2,
      }}
    >
      <Typography sx={{ maxWidth: '12rem' }} variant='caption'>
        Click All Hubs to view a list of UPS hubs around the country.
      </Typography>
      <Button variant='contained' href='/all'>
        All Hubs
      </Button>
    </Box>
  );
}

export default AllHubsButton;
