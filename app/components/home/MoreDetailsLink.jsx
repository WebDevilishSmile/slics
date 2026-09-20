'use client';

import { Button } from '@mui/material';
import Link from 'next/link';

export default function MoreDetailsLink({ slic }) {
  console.log(slic);
  return (
    <Button
      variant='contained'
      sx={{ mt: 2 }}
      href={`/home/${slic.numSlic}`}
      LinkComponent={Link}
    >
      More Details
    </Button>
  );
}
