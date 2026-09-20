import DriversTable from '@/app/components/drivers/DriversTable';
import SearchAddDriver from '@/app/components/drivers/SearchAddDriver';
import BackButton from '@/app/components/layout/BackButton';
import { Typography } from '@mui/material';
import { getAllDrivers } from '@/utils/drivers';
import { serializeDrivers } from '@/utils/functions';

async function Drivers() {
  const allDrivers = await getAllDrivers();

  return (
    <>
      <BackButton />
      <Typography variant='sectionHeading'>Drivers Page</Typography>

      {/* <EditDriversData /> */}
      <DriversTable allDrivers={serializeDrivers(allDrivers)} />
    </>
  );
}

export default Drivers;
