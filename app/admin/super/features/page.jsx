import { Alert, Paper, Typography } from '@mui/material';

import FeaturesView from '@/components/admin/hub/FeaturesView';
import { getSession, isSuperAdmin } from '@/lib/authz';
import { getFeaturesFresh } from '@/lib/db/appSettings';
import theme from '@/theme';

// Switches that used to need a deploy (docs/SUPER-ADMIN-HUB.md stage F,
// lib/db/appSettings.js). Read past the cache, so it shows what's saved.
// Super admin only; checked here before reading anything.
export default async function FeaturesPage() {
  const session = await getSession();
  if (!isSuperAdmin(session)) return null;

  let features = null;
  try {
    features = await getFeaturesFresh();
  } catch (error) {
    console.error('Error loading the feature switches:', error);
  }

  return (
    <>
      <Typography variant='sectionHeading'>Features</Typography>
      <Paper
        variant='panel'
        sx={{ maxWidth: theme.layout.width.prose, minHeight: 0, alignItems: 'stretch', px: { xs: 2, sm: 3 }, py: 3 }}
      >
        {features ? (
          <FeaturesView initial={features} />
        ) : (
          <Alert severity='error'>Couldn&apos;t load the switches. Try again in a moment.</Alert>
        )}
      </Paper>
    </>
  );
}
