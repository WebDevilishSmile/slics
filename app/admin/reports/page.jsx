import { Typography } from '@mui/material';
import { getSession } from '@/lib/authz';
import { getSlicReports } from '@/lib/db/slicReports';
import RedirectMessage from '@/components/layout/RedirectMessage';
import SlicReportsQueue from '@/components/admin/slicReports/SlicReportsQueue';
import HydrationGuard from '@/components/utility/HydrationGuard';

// Driver reports of a wrong phone, address or a closed SLIC
// (RECOMMENDATIONS.md #5). Checks admin itself, not only through the layout
// (docs/SECURITY.md #7).
export default async function ReportsPage() {
  const session = await getSession();
  if (session?.user?.role !== 'admin') {
    return (
      <RedirectMessage
        heading='You must be an administrator to access this content.'
        subheading='Redirecting you to the home page...'
        redirect='/home'
      />
    );
  }

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
