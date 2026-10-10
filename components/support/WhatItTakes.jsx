import { Box, Typography } from '@mui/material';

import theme from '@/theme';
import { getEffortNumbers } from '@/lib/impact';
import { SUPPORT_HOURS_ESTIMATE } from '@/constants';
import { softInset } from '@/components/utility/soft';

const number = (value) => new Intl.NumberFormat('en-US').format(value);

function Stat({ value, label }) {
  return (
    <Box sx={{ textAlign: 'center', minWidth: 0 }}>
      <Typography variant='h5' component='p' sx={{ fontWeight: 800, color: 'primary.main' }}>
        {value}
      </Typography>
      <Typography variant='caption' color='text.secondary' component='p'>
        {label}
      </Typography>
    </Box>
  );
}

// "What it takes" (docs/BMC-SUPPORT.md stage 4): the effort behind the app,
// with no dollar figures and no ask beyond the button under it. An inset well
// inside the Contributions card. The SLIC and PDF counts are live; the hours
// are SUPPORT_HOURS_ESTIMATE. If the counts fail, it shows the hours alone.
export default async function WhatItTakes() {
  let effort = null;
  try {
    effort = await getEffortNumbers();
  } catch (error) {
    console.error('Error loading effort numbers:', error);
  }

  return (
    <Box
      component='figure'
      sx={[softInset(theme), { m: 0, mb: 3, p: 2.5, borderRadius: 4 }]}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: effort ? 'repeat(3, 1fr)' : '1fr',
          gap: 1.5,
        }}
      >
        <Stat value={`${SUPPORT_HOURS_ESTIMATE}+`} label='hours of my own time' />
        {effort && <Stat value={number(effort.total)} label='SLICs entered by hand' />}
        {effort && <Stat value={number(effort.withPdf)} label='directions PDFs' />}
      </Box>
      <Typography
        component='figcaption'
        variant='body2'
        color='text.secondary'
        sx={{ textAlign: 'center', mt: 2 }}
      >
        Built on evenings and days off, by one driver. Support helps keep it online and pays for
        the time that goes into what&apos;s next.
      </Typography>
    </Box>
  );
}
