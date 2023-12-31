import { Box, Typography } from '@mui/material';

export default function Heading() {
  return (
    <Box /* HEADING */
      id="selection"
      sx={{ width: { xs: '90%', sm: '90%', md: '35rem' } }}
    >
      <Typography
        textAlign="center"
        variant="h6"
        sx={{
          textTransform: 'uppercase',
          fontWeight: '700',
        }}
      >
        Origin UPS Center
      </Typography>
      <Typography textAlign="center" variant="h6" sx={{}}>
        BETPA 1809
      </Typography>
    </Box>
  );
}
