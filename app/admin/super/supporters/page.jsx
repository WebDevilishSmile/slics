import { Alert, Paper, Typography } from '@mui/material';

import SupportersView from '@/components/admin/supporters/SupportersView';
import { getSession, isSuperAdmin } from '@/lib/authz';
import { getSupportOverview } from '@/lib/db/bmcEvents';
import theme from '@/theme';

// Buy Me a Coffee support as the webhook saved it (docs/BMC-SUPPORT.md stage
// 2). Emails, amounts and messages: super admin only. The layouts redirect
// everyone else, and this page checks again before reading anything
// (SECURITY.md #7: a layout isn't a boundary).
export default async function SupportersPage() {
  const session = await getSession();
  if (!isSuperAdmin(session)) return null;

  let overview = null;
  try {
    overview = await getSupportOverview();
  } catch (error) {
    console.error('Error loading supporters overview:', error);
  }

  return (
    <>
      <Typography variant='sectionHeading'>Supporters</Typography>
      <Paper variant='panel' sx={{ maxWidth: theme.layout.width.prose, alignItems: 'stretch', px: { xs: 2, sm: 3 } }}>
        {overview ? (
          <SupportersView {...overview} />
        ) : (
          <Alert severity='error'>Couldn&apos;t load the supporters. Try again in a moment.</Alert>
        )}
      </Paper>
    </>
  );
}
