import DriversTable from '@/app/components/drivers/DriversTable';
import SearchAddDriver from '@/app/components/drivers/SearchAddDriver';
import { Typography } from '@mui/material';
import { getAllDrivers } from '@/utils/drivers';
import { serializeDrivers } from '@/utils/functions';

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
