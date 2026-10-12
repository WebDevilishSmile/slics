import { Typography } from '@mui/material';
import { getAdminSession } from '@/lib/authz';
import { getClaimableDriverNames, getDriverClaims } from '@/lib/db/driverClaims';
import { getCoverDisputes } from '@/lib/db/coverDisputes';
import { getDriverRoster } from '@/lib/db/drivers';
import CoverDisputesList from '@/components/admin/driverClaims/CoverDisputesList';
import DriverClaimsQueue from '@/components/admin/driverClaims/DriverClaimsQueue';
import HydrationGuard from '@/components/utility/HydrationGuard';

// Drivers asking to be verified for covers (docs/COVER-BIDDING.md): each claim
// with its evidence, and the sheet's names to link it to. `onSheet` maps a
// roster row's id to the sheet driver it's merged with (lib/driverRoster.js),
// so a claim whose employee ID is on the roster points straight at a name.
// Above them, verified drivers who say they should be on the cover list
// ("This is a mistake" on /covers, lib/db/coverDisputes.js), when there are
// any.
export default async function DriverClaimsPage() {
  if (!(await getAdminSession())) return null;

  const [{ pending, decided }, names, { drivers }, disputes] = await Promise.all([
    getDriverClaims(),
    getClaimableDriverNames(),
    getDriverRoster(),
    getCoverDisputes(),
  ]);
  const onSheet = Object.fromEntries(
    drivers
      .filter((driver) => driver.roster)
      .map((driver) => [driver.roster._id, { name: driver.name, rank: driver.rank }]),
  );

  return (
    <>
      <Typography variant='sectionHeading'>Driver Claims</Typography>
      <HydrationGuard>
        <CoverDisputesList initialOpen={disputes.open} initialClosed={disputes.closed} />
        <DriverClaimsQueue
          initialPending={pending}
          initialDecided={decided}
          names={names}
          onSheet={onSheet}
        />
      </HydrationGuard>
    </>
  );
}
