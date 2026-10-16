import { Typography, Paper } from '@mui/material';
import { redirect } from 'next/navigation';
import { areasOf, getSession, isStaff, isSuperAdmin } from '@/lib/authz';
import StaffHub from '@/components/admin/StaffHub';
import ThankYouPreview from '@/components/admin/ThankYouPreview';

// The admins' hub: the banners and links of the tools their role has
// (docs/STAFF-ROLES.md; every one by default). A dispatcher's hub is
// /dispatch, which the layout's staff check would otherwise let in here.
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
        <ThankYouPreview firstName={session.user.name?.split(' ')[0]} />
      </Paper>
    </>
  );
}

export default AdminPage;
