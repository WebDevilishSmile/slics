import { getAdminSession } from '@/lib/authz';
import { serializeSlics } from '@/lib/serializers';
import { getAllSlics } from '@/lib/db/slics';

import { Typography } from '@mui/material';
import SlicsTable from '@/components/admin/slics/SlicsTable';

async function SlicsTablePage() {
  // app/admin/layout.jsx shows everyone else the redirect message.
  if (!(await getAdminSession())) return null;

  const slics = await getAllSlics();

  return (
    <>
      <Typography variant='sectionHeading'>SLICs</Typography>

      <SlicsTable slics={serializeSlics(slics)} />
    </>
  );
}

export default SlicsTablePage;
