import { Typography } from '@mui/material';
import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession } from '@/lib/authz';
import { getDriverRoster } from '@/lib/db/drivers';
import DriversView from '@/components/drivers/DriversView';

// Every driver on the on-call sheet with the roster merged in, then the roster
// rows on no sheet (lib/driverRoster.js).
async function Drivers() {
  if (!(await getAreaSession('drivers'))) return <NoAccess />;

  const { drivers, rosterOnly, counts } = await getDriverRoster();

  return (
    <>
      <Typography variant='sectionHeading'>Drivers</Typography>

      <DriversView drivers={drivers} rosterOnly={rosterOnly} counts={counts} />
    </>
  );
}

export default Drivers;
