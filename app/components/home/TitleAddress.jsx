import { Box, Typography } from '@mui/material';

function TitleAddress({ slic }) {
  return (
    <>
      <Typography variant='h6' sx={{ textAlign: 'center' }}>
        {slic?.numSlic} - {slic.type === 'center' ? slic.alphaSlic : slic.name}
      </Typography>

      <Box sx={{ textAlign: 'center', mt: '1rem' }}>
        <Typography>{slic.address.street}</Typography>
        <Typography>
          {slic.address.city}, {slic.address.state} {slic.address.zip}
        </Typography>
      </Box>
    </>
  );
}

export default TitleAddress;
