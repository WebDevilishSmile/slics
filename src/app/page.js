import { Box, Button, Paper, Typography } from '@mui/material';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import { cookies } from 'next/headers';

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });
  let { data: customers, error } = await supabase.from('customers').select('*');

  const slics = customers.map((slic) => {
    return <Typography key={slic.id}>{slic.numSlic}</Typography>;
  });

  return (
    <Box /* HOME PAGE CONTAINER */
      id="home"
      sx={{
        width: '100vw',
        minHeight: '100rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        pt: '6rem',
        bgcolor: '#ebe8e8',
      }}
    >
      <Paper sx={{ width: '20rem', height: '20rem' }}>
        <Typography>HELLO WORLD</Typography>
        <Button variant="contained" color="primary">
          SIGN IN
        </Button>
        {slics}
      </Paper>
    </Box>
  );
}
