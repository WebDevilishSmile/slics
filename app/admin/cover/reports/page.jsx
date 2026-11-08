import { Typography } from '@mui/material';

import NoAccess from '@/components/admin/NoAccess';
import CoverReportsQueue from '@/components/admin/coverReports/CoverReportsQueue';
import HydrationGuard from '@/components/utility/HydrationGuard';
import { getAreaSession } from '@/lib/authz';
import { getCoverReports } from '@/lib/db/coverReports';

export const metadata = {
  title: 'Cover Reports · SLICs',
};

// What drivers report wrong on Covers ("Report a problem" on /covers,
// docs/COVER-BIDDING.md "Reference only and cover reports"). Checks the Covers
// area before reading anything, like every admin page (docs/SECURITY.md #7).
export default async function CoverReportsPage() {
  if (!(await getAreaSession('covers'))) return <NoAccess />;

  const { open, closed } = await getCoverReports();

  return (
    <>
      <Typography variant='sectionHeading'>Cover Reports</Typography>
      <HydrationGuard>
        <CoverReportsQueue initialOpen={open} initialClosed={closed} />
      </HydrationGuard>
    </>
  );
}
