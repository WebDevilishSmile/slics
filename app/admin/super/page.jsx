import { Paper, Typography } from '@mui/material';

import AdminLinks from '@/components/admin/AdminLinks';
import { getSession, isSuperAdmin } from '@/lib/authz';

export default async function SuperAdminPage() {
  if (!isSuperAdmin(await getSession())) return null;

  const links = [
    { href: '/admin/super/admins', label: 'Admins' },
    { href: '/admin/super/supporters', label: 'Supporters' },
  ];

  return (
    <>
      <Typography variant='sectionHeading'>Super Admin</Typography>
      <Paper variant='panel' sx={{ gap: 3 }}>
        <AdminLinks links={links} />
      </Paper>
    </>
  );
}
