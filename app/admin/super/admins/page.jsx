import { Alert, Paper, Typography } from '@mui/material';

import AdminsView from '@/components/admin/super/AdminsView';
import { getSession, isSuperAdmin } from '@/lib/authz';
import { getAdminOverview } from '@/lib/db/admins';
import theme from '@/theme';

// Who the admins are and what they've done; add or remove one. Super admin
// only: the layout redirects everyone else, and this checks again before
// reading anything.
export default async function AdminsPage() {
  const session = await getSession();
  if (!isSuperAdmin(session)) return null;

  let overview = null;
  try {
    overview = await getAdminOverview();
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
          <AdminsView {...overview} myId={session.user.id} />
        ) : (
          <Alert severity='error'>Couldn&apos;t load the admins. Try again in a moment.</Alert>
        )}
      </Paper>
    </>
  );
}
