import NoAccess from '@/components/admin/NoAccess';
import CoverJobsPage from '@/components/admin/coverBidJobs/CoverJobsPage';
import { getAreaSession } from '@/lib/authz';

// The week's cover jobs. The page itself is client-side; this checks the
// Covers area first, like every admin page (docs/STAFF-ROLES.md).
export default async function CoverJobs() {
  if (!(await getAreaSession('covers'))) return <NoAccess />;
  return <CoverJobsPage />;
}
