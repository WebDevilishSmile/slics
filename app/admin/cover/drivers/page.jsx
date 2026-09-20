import { Suspense } from 'react';

import DriversTable from '@/app/components/covers/DriversTable';
import BackButton from '@/app/components/layout/BackButton';
import LoadingFallback from '@/app/components/layout/LoadingFallback';
import { Typography } from '@mui/material';
import { getCovers } from '@/utils/covers';
import { serializeCovers } from '@/utils/functions';

async function CoverDrivers() {
  const covers = await getCovers();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <BackButton />
      <Typography variant='sectionHeading'>Cover Drivers</Typography>

      <DriversTable covers={serializeCovers(covers)} />
    </Suspense>
  );
}

export default CoverDrivers;
