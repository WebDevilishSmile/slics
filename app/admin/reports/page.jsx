import { Typography } from '@mui/material';
import { getAdminSession } from '@/lib/authz';
import { getSlicReports } from '@/lib/db/slicReports';
import SlicReportsQueue from '@/components/admin/slicReports/SlicReportsQueue';
import HydrationGuard from '@/components/utility/HydrationGuard';

// Driver reports of a wrong phone, address or a closed SLIC
// (RECOMMENDATIONS.md #5).
export default async function ReportsPage() {
  if (!(await getAdminSession())) return null;

  const { open, closed } = await getSlicReports();

  return (
    <>
      <Typography variant='sectionHeading'>SLIC Reports</Typography>
      <HydrationGuard>
        <SlicReportsQueue initialOpen={open} initialClosed={closed} />
      </HydrationGuard>
    </>
  );
}
