import { Suspense } from 'react';

import CoverDriversTable from '@/components/covers/CoverDriversTable';
import LoadingFallback from '@/components/layout/LoadingFallback';
import { Typography } from '@mui/material';
import { getCovers } from '@/lib/db/covers';
import { serializeCovers } from '@/lib/serializers';

async function CoverDrivers() {
  const covers = await getCovers();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Typography variant='sectionHeading'>Cover Drivers</Typography>

      <CoverDriversTable covers={serializeCovers(covers)} />
    </Suspense>
  );
}

export default CoverDrivers;
