import { Alert, Paper, Typography } from '@mui/material';

import NotificationsView from '@/components/admin/hub/NotificationsView';
import { getSession, isSuperAdmin } from '@/lib/authz';
import { getPushLog } from '@/lib/db/pushLog';
import { getNotificationsOverview } from '@/lib/db/pushOverview';
import theme from '@/theme';

// Push notifications in one place (docs/SUPER-ADMIN-HUB.md stage C): stats,
// every admin's devices and kinds, samples, a written message and the send
// log. Super admin only; checked here before reading anything.
export default async function NotificationsPage() {
  const session = await getSession();
  if (!isSuperAdmin(session)) return null;

  let data = null;
  try {
    const [overview, log] = await Promise.all([getNotificationsOverview(), getPushLog()]);
    data = { overview, log };
  } catch (error) {
    console.error('Error loading the notifications page:', error);
  }

  return (
    <>
      <Typography variant='sectionHeading'>Notifications</Typography>
      <Paper
        variant='panel'
        sx={{ maxWidth: theme.layout.width.wide, minHeight: 0, alignItems: 'stretch', px: { xs: 2, sm: 3 }, py: 3 }}
      >
        {data ? (
          <NotificationsView overview={data.overview} log={data.log} myId={session.user.id} />
        ) : (
          <Alert severity='error'>Couldn&apos;t load the notifications. Try again in a moment.</Alert>
        )}
      </Paper>
    </>
  );
}
