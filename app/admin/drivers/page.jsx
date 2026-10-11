import DriversTable from '@/components/drivers/DriversTable';
import { Typography } from '@mui/material';
import { getAllDrivers } from '@/lib/db/drivers';
import { serializeDrivers } from '@/lib/serializers';
import { getAdminSession } from '@/lib/authz';

async function Drivers() {
  if (!(await getAdminSession())) return null;

  const allDrivers = await getAllDrivers();

  return (
    <>
      <Typography variant='sectionHeading'>Drivers</Typography>

      <DriversTable allDrivers={serializeDrivers(allDrivers)} />
    </>
  );
}

export default Drivers;
