import { Alert, Paper, Typography } from '@mui/material';

import HealthView from '@/components/admin/hub/HealthView';
import { getSession, isSuperAdmin } from '@/lib/authz';
import { getSystemHealth } from '@/lib/systemHealth';
import theme from '@/theme';

// What the app depends on, checked on every visit (docs/SUPER-ADMIN-HUB.md
// stage E, lib/systemHealth.js). Keys show as set or not, never their values.
// Super admin only; checked here before reading anything.
export default async function HealthPage() {
  const session = await getSession();
  if (!isSuperAdmin(session)) return null;

  let health = null;
  try {
    health = await getSystemHealth();
  } catch (error) {
    console.error('Error running the health checks:', error);
  }

  return (
    <>
      <Typography variant='sectionHeading'>System Health</Typography>
      <Paper
        variant='panel'
        sx={{ maxWidth: theme.layout.width.wide, minHeight: 0, alignItems: 'stretch', px: { xs: 2, sm: 3 }, py: 3 }}
      >
        {health ? (
          <HealthView health={health} />
        ) : (
          <Alert severity='error'>Couldn&apos;t run the checks. Try again in a moment.</Alert>
        )}
      </Paper>
    </>
  );
}
