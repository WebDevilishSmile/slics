import CoverDriversFromSheet from '@/components/covers/CoverDriversFromSheet';
import { Typography } from '@mui/material';
import { getAdminSession } from '@/lib/authz';

// The week's cover and on-call drivers, from the on-call sheet's pick section
// (docs/RECOMMENDATIONS.md #3). Replaced the hand-edited `cover` list on
// 2026-10-10.
async function CoverDrivers() {
  if (!(await getAdminSession())) return null;

  return (
    <>
      <Typography variant='sectionHeading'>Cover Drivers</Typography>
      <CoverDriversFromSheet />
    </>
  );
}

export default CoverDrivers;
