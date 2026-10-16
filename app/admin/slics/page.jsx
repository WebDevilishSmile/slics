import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession } from '@/lib/authz';
import { serializeSlics, withNamedStamps } from '@/lib/serializers';
import { getAllSlics } from '@/lib/db/slics';

import { Typography } from '@mui/material';
import SlicsTable from '@/components/admin/slics/SlicsTable';

async function SlicsTablePage() {
  // app/admin/layout.jsx shows everyone else the redirect message.
  const session = await getAreaSession('slics');
  if (!session) return <NoAccess />;

  // Editors by name only for anyone but an admin (lib/serializers.js).
  const slics =
    session.user.role === 'admin'
      ? serializeSlics(await getAllSlics())
      : serializeSlics(await getAllSlics()).map(withNamedStamps);

  return (
    <>
      <Typography variant='sectionHeading'>SLICs</Typography>

      <SlicsTable slics={slics} />
    </>
  );
}

export default SlicsTablePage;
