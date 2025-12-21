import DriversTable from '@/app/components/drivers/DriversTable';
import EditDriversData from '@/app/components/drivers/EditDriversData';
import StyledHeading from '@/app/components/layout/StyledHeading';
import { getAllDrivers } from '@/utils/drivers';
import { serializeDrivers } from '@/utils/functions';

async function Drivers() {
  const allDrivers = await getAllDrivers();

  return (
    <>
      <StyledHeading>Drivers Page</StyledHeading>

      {/* <EditDriversData /> */}

      <DriversTable allDrivers={serializeDrivers(allDrivers)} />
    </>
  );
}

export default Drivers;
