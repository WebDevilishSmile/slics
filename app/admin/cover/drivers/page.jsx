import CoverDriversFromSheet from '@/components/covers/CoverDriversFromSheet';
import { Typography } from '@mui/material';
import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession } from '@/lib/authz';

// The week's cover and on-call drivers, from the on-call sheet's pick section
// (docs/RECOMMENDATIONS.md #3). Replaced the hand-edited `cover` list on
// 2026-10-10.
async function CoverDrivers() {
  if (!(await getAreaSession('covers'))) return <NoAccess />;

  return (
    <>
      <Typography variant='sectionHeading'>Cover Drivers</Typography>
      <CoverDriversFromSheet />
    </>
  );
}

export default CoverDrivers;
