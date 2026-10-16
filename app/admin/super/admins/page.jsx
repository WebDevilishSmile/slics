import { Alert, Paper, Typography } from '@mui/material';

import AdminsView from '@/components/admin/super/AdminsView';
import { getSession, isSuperAdmin } from '@/lib/authz';
import { getAdminOverview } from '@/lib/db/admins';
import { getRoleAreasFresh } from '@/lib/db/appSettings';
import theme from '@/theme';

// Which tools each staff role may use, who the admins and dispatchers are and
// what they've done; add, move or remove one (docs/STAFF-ROLES.md). Super
// admin only: the layout redirects everyone else, and this checks again
// before reading anything.
export default async function AdminsPage() {
  const session = await getSession();
  if (!isSuperAdmin(session)) return null;

  let overview = null;
  try {
    const [staff, roleAreas] = await Promise.all([getAdminOverview(), getRoleAreasFresh()]);
    overview = { ...staff, roleAreas };
  } catch (error) {
    console.error('Error loading the admins overview:', error);
  }

  return (
    <>
      <Typography variant='sectionHeading'>Admins</Typography>
      <Paper
        variant='panel'
        sx={{ maxWidth: theme.layout.width.prose, alignItems: 'stretch', px: { xs: 2, sm: 3 } }}
      >
        {overview ? (
          <AdminsView
            {...overview}
            myId={session.user.id}
            firstName={session.user.name?.split(' ')[0]}
          />
        ) : (
          <Alert severity='error'>Couldn&apos;t load the admins. Try again in a moment.</Alert>
        )}
      </Paper>
    </>
  );
}
