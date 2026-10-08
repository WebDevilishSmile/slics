'use client';

import { Paper, Typography } from '@mui/material';
import SlicActions from '@/components/home/SlicActions';

// /home/[slic] has no comments section, so SlicActions leaves Tips off. The
// panel gives SlicActions' soft tiles the surface they're colored to match.
export default function Title({ slic }) {
  return (
    <Paper variant='panel' sx={{ justifyContent: 'center' }}>
      <Typography variant='h4' component='h2' sx={{ fontWeight: 700 }}>
        {slic.alphaSlic} / {slic.numSlic}
      </Typography>

      <SlicActions slic={slic} />
    </Paper>
  );
}
