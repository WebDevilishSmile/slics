import CoverDriversFromSheet from '@/components/covers/CoverDriversFromSheet';
import { Typography } from '@mui/material';

// The week's cover and on-call drivers, from the on-call sheet's pick section
// (docs/RECOMMENDATIONS.md #3). Replaced the hand-edited `cover` list on
// 2026-10-10.
function CoverDrivers() {
  return (
    <>
      <Typography variant='sectionHeading'>Cover Drivers</Typography>
      <CoverDriversFromSheet />
    </>
  );
}

export default CoverDrivers;
