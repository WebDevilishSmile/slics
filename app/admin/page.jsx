import { Typography, Paper } from '@mui/material';
import { redirect } from 'next/navigation';
import { areasOf, getSession, isStaff, isSuperAdmin } from '@/lib/authz';
import StaffHub from '@/components/admin/StaffHub';

// The admins' hub: the banners and links of the tools their role has
// (docs/STAFF-ROLES.md; every one by default). A dispatcher's hub is
// /dispatch, which the layout's staff check would otherwise let in here. The
// note previews moved to the super admin hub on 2026-10-16.
async function AdminPage() {
  const session = await getSession();
  if (!isStaff(session)) return null;
  if (session.user.role !== 'admin') redirect('/dispatch');

  return (
    <>
      <Typography variant='sectionHeading'>Admin</Typography>

      <Paper variant='panel' sx={{ gap: 3 }}>
        <StaffHub
          areas={areasOf(session)}
          userId={session.user.id}
          // Admins and Supporters live under it (lib/authz.js).
          extraLinks={isSuperAdmin(session) ? [{ href: '/admin/super', label: 'Super Admin' }] : []}
        />
      </Paper>
    </>
  );
}

export default AdminPage;
