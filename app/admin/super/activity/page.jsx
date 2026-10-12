import { Alert, Paper, Typography } from '@mui/material';

import ActivityFeed from '@/components/admin/hub/ActivityFeed';
import { getSession, isSuperAdmin } from '@/lib/authz';
import { getActivity } from '@/lib/db/activity';
import theme from '@/theme';

// Everything happening in the app, newest first (docs/SUPER-ADMIN-HUB.md
// stage D, lib/db/activity.js). Super admin only; checked here before reading
// anything.
export default async function ActivityPage() {
  const session = await getSession();
  if (!isSuperAdmin(session)) return null;

  let initial = null;
  try {
    initial = await getActivity();
  } catch (error) {
    console.error('Error loading the activity feed:', error);
  }

  return (
    <>
      <Typography variant='sectionHeading'>Activity</Typography>
      <Paper
        variant='panel'
        sx={{ maxWidth: theme.layout.width.wide, minHeight: 0, alignItems: 'stretch', px: { xs: 2, sm: 3 }, py: 3 }}
      >
        {initial ? (
          <ActivityFeed initial={initial} />
        ) : (
          <Alert severity='error'>Couldn&apos;t load the activity. Try again in a moment.</Alert>
        )}
      </Paper>
    </>
  );
}
