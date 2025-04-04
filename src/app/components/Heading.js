import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import Maintenance from './Maintenance';

export default function Heading() {
  return (
    <Box /* HEADING */
      id='selection'
      sx={{
        width: { xs: '90%', sm: '90%', md: '35rem' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Maintenance />

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

      <Typography textAlign='center' sx={{ mt: '1rem' }}>
        A new version of SLICs is out. Click below to go to the new site. Make
        sure to save the new address or bookmark the site.
      </Typography>
      <Button
        LinkComponent={Link}
        href='https://slics-beta.vercel.app/1809'
        variant='outlined'
        sx={{ mt: '1rem' }}
      >
        SLICs 4.0
      </Button>
    </Box>
  );
}
