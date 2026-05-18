import DriversTable from '@/app/components/drivers/DriversTable';
import SearchAddDriver from '@/app/components/drivers/SearchAddDriver';
import BackButton from '@/app/components/layout/BackButton';
import StyledHeading from '@/app/components/layout/StyledHeading';
import { getAllDrivers } from '@/utils/drivers';
import { serializeDrivers } from '@/utils/functions';

async function Drivers() {
  const allDrivers = await getAllDrivers();

  return (
    <>
      <BackButton />
      <StyledHeading>Drivers Page</StyledHeading>

      {/* <EditDriversData /> */}
      <DriversTable allDrivers={serializeDrivers(allDrivers)} />
    </>
  );
}

export default Drivers;
