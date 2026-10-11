import { Typography } from '@mui/material';
import { getAdminSession } from '@/lib/authz';
import { getDriverRoster } from '@/lib/db/drivers';
import DriversView from '@/components/drivers/DriversView';

// Every driver on the on-call sheet with the roster merged in, then the roster
// rows on no sheet (lib/driverRoster.js).
async function Drivers() {
  if (!(await getAdminSession())) return null;

  const { drivers, rosterOnly, counts } = await getDriverRoster();

  return (
    <>
      <Typography variant='sectionHeading'>Drivers</Typography>

      <DriversView drivers={drivers} rosterOnly={rosterOnly} counts={counts} />
    </>
  );
}

export default Drivers;
