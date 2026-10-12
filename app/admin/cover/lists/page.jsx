import { Typography } from '@mui/material';

import { getAdminSession } from '@/lib/authz';
import CoverListsAdmin from '@/components/admin/coverLists/CoverListsAdmin';

// Every verified driver's cover list for a week, and the most wanted jobs
// (docs/COVER-BIDDING.md, stage 2).
async function CoverLists() {
  if (!(await getAdminSession())) return null;

  return (
    <>
      <Typography variant='sectionHeading'>Cover Lists</Typography>
      <CoverListsAdmin />
    </>
  );
}

export default CoverLists;
