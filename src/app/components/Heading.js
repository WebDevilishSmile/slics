import { Box, Typography } from '@mui/material';

export default function Heading() {
  return (
    <Box /* HEADING */
      id='selection'
      sx={{ width: { xs: '90%', sm: '90%', md: '35rem' } }}
    >
      <Typography
        textAlign='center'
        variant='h5'
        sx={{
          textTransform: 'uppercase',
          fontSize: '1.5rem',
          fontWeight: '700',
        }}
      >
        Origin UPS Center
      </Typography>
      <Typography textAlign='center' variant='h6' sx={{ fontSize: '1rem' }}>
        BETPA 1809
      </Typography>
    </Box>
  );
}
