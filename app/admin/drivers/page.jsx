import DriversTable from '@/components/drivers/DriversTable';
import { Typography } from '@mui/material';
import { getAllDrivers } from '@/lib/db/drivers';
import { serializeDrivers } from '@/lib/serializers';

async function Drivers() {
  const allDrivers = await getAllDrivers();

  return (
    <>
      <Typography variant='sectionHeading'>Drivers Page</Typography>

      <DriversTable allDrivers={serializeDrivers(allDrivers)} />
    </>
  );
}

export default Drivers;
