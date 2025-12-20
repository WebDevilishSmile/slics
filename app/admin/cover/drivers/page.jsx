import { Suspense } from 'react';

import DriversTable from '@/app/components/covers/DriversTable';
import BackButton from '@/app/components/layout/BackButton';
import LoadingFallback from '@/app/components/layout/LoadingFallback';
import StyledHeading from '@/app/components/layout/StyledHeading';
import { getCovers } from '@/utils/covers';
import { serializeCovers } from '@/utils/functions';

async function CoverDrivers() {
  const covers = await getCovers();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <BackButton />
      <StyledHeading>Cover Drivers</StyledHeading>

      <DriversTable covers={serializeCovers(covers)} />
    </Suspense>
  );
}

export default CoverDrivers;
