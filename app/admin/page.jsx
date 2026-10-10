import { Typography, Paper } from '@mui/material';
import { auth } from '@/auth';
import AdminLinks from '@/components/admin/AdminLinks';
import JobChangesNotice from '@/components/admin/sheetJobs/JobChangesNotice';
import { getUnseenJobChanges } from '@/lib/db/sheetJobs';
import { getJobChangesSeenAt } from '@/lib/db/users';

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

async function AdminPage() {
  const session = await auth();
  const jobChanges = await unseenJobChanges(session?.user?.id);

  const adminLinks = [
    { href: '/admin/slics', label: 'SLICs' },
    { href: '/admin/comments', label: 'Comments' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/jobs', label: 'Jobs' },
    { href: '/admin/cover/drivers', label: 'Cover Drivers' },
    { href: '/admin/cover/jobs', label: 'Cover Jobs' },
    { href: '/admin/drivers', label: 'Drivers' },
    { href: '/admin/planet-fitness', label: 'Planet Fitness' },
  ];

  return (
    <>
      <Typography variant='sectionHeading'>Admin</Typography>

      <Paper variant='panel' sx={{ gap: 3 }}>
        <JobChangesNotice {...jobChanges} />
        <AdminLinks links={adminLinks} />
      </Paper>
    </>
  );
}

export default AdminPage;
