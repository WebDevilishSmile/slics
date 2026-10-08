import { Typography, Paper } from '@mui/material';
import AdminLinks from '@/components/admin/AdminLinks';

async function AdminPage() {
  const adminLinks = [
    { href: '/admin/slics', label: 'Slics' },
    { href: '/admin/comments', label: 'Comments' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/cover/drivers', label: 'Cover Drivers' },
    { href: '/admin/cover/jobs', label: 'Cover Jobs' },
    { href: '/admin/drivers', label: 'Drivers' },
    { href: '/admin/planet-fitness', label: 'Planet Fitness' },
  ];

  return (
    <>
      <Typography variant='sectionHeading'>Admin Page</Typography>

      <Paper variant='panel'>
        <AdminLinks links={adminLinks} />
      </Paper>
    </>
  );
}

export default AdminPage;
