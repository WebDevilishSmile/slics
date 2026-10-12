import { Typography, Paper } from '@mui/material';
import { getAdminSession, isSuperAdmin } from '@/lib/authz';
import AdminLinks from '@/components/admin/AdminLinks';
import ThankYouPreview from '@/components/admin/ThankYouPreview';
import JobChangesNotice from '@/components/admin/sheetJobs/JobChangesNotice';
import { getUnseenJobChanges } from '@/lib/db/sheetJobs';
import { getJobChangesSeenAt } from '@/lib/db/users';
import SlicReportsNotice from '@/components/admin/slicReports/SlicReportsNotice';
import { getOpenReportSummary } from '@/lib/db/slicReports';
import DriverClaimsNotice from '@/components/admin/driverClaims/DriverClaimsNotice';
import { getPendingClaimCount } from '@/lib/db/driverClaims';

// Jobs-tab changes this admin hasn't seen, for the banner. A failure only
// hides the banner: the admin index must always load.
async function unseenJobChanges(userId) {
  try {
    return await getUnseenJobChanges(await getJobChangesSeenAt(userId));
  } catch (error) {
    console.error('Error loading unseen job changes for /admin:', error);
    return { count: 0, jobs: [], latest: [] };
  }
}

// Open driver reports on SLICs, for their banner. Same rule: a failure only
// hides it.
async function openReports() {
  try {
    return await getOpenReportSummary();
  } catch (error) {
    console.error('Error loading open SLIC reports for /admin:', error);
    return { count: 0, slics: [] };
  }
}

// Driver claims waiting for a decision, for their banner. Same rule.
async function pendingClaims() {
  try {
    return await getPendingClaimCount();
  } catch (error) {
    console.error('Error counting driver claims for /admin:', error);
    return 0;
  }
}

async function AdminPage() {
  const session = await getAdminSession();
  if (!session) return null;

  const [jobChanges, reports, claims] = await Promise.all([
    unseenJobChanges(session.user.id),
    openReports(),
    pendingClaims(),
  ]);

  const adminLinks = [
    { href: '/admin/slics', label: 'SLICs' },
    { href: '/admin/reports', label: 'SLIC Reports' },
    { href: '/admin/driver-claims', label: 'Driver Claims' },
    { href: '/admin/comments', label: 'Comments' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/jobs', label: 'Jobs' },
    { href: '/admin/cover/drivers', label: 'Cover Drivers' },
    { href: '/admin/cover/jobs', label: 'Cover Jobs' },
    { href: '/admin/cover/lists', label: 'Cover Lists' },
    { href: '/admin/drivers', label: 'Drivers' },
    { href: '/admin/planet-fitness', label: 'Planet Fitness' },
    // Admins and Supporters live under it (lib/authz.js).
    ...(isSuperAdmin(session) ? [{ href: '/admin/super', label: 'Super Admin' }] : []),
  ];

  return (
    <>
      <Typography variant='sectionHeading'>Admin</Typography>

      <Paper variant='panel' sx={{ gap: 3 }}>
        <SlicReportsNotice {...reports} />
        <DriverClaimsNotice count={claims} />
        <JobChangesNotice {...jobChanges} />
        <AdminLinks links={adminLinks} />
        <ThankYouPreview firstName={session.user.name?.split(' ')[0]} />
      </Paper>
    </>
  );
}

export default AdminPage;
