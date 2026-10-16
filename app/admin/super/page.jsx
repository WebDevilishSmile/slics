import { Paper, Typography } from '@mui/material';

import HubView from '@/components/admin/hub/HubView';
import { getSession, isSuperAdmin } from '@/lib/authz';
import { getActivity } from '@/lib/db/activity';
import { getFeaturesFresh, getRoleAreas } from '@/lib/db/appSettings';
import { getSupportSummary } from '@/lib/db/bmcEvents';
import { getAdminCounts, getGlanceNumbers, getUsageSeries } from '@/lib/db/hub';
import { getNotificationsSummary } from '@/lib/db/pushOverview';
import { getSystemHealth } from '@/lib/systemHealth';
import theme from '@/theme';

// One part of the hub: its data, or null (logged) when it fails, so the rest
// of the page still loads.
const part = (name, load) =>
  load().catch((error) => {
    console.error(`Error loading the hub's ${name}:`, error);
    return null;
  });

// The super admin hub (docs/SUPER-ADMIN-HUB.md): the app at a glance, the
// places to manage it, usage and the latest activity. Super admin only: the
// layout redirects everyone else, and this checks again before reading
// anything (SECURITY.md #7).
export default async function SuperAdminPage() {
  const session = await getSession();
  if (!isSuperAdmin(session)) return null;

  // The welcome note's preview names each role's tools; getRoleAreas never
  // throws (the defaults stand in).
  const [glance, usage, notifications, activity, health, features, admins, support, roleAreas] = await Promise.all([
    part('numbers', getGlanceNumbers),
    part('usage', getUsageSeries),
    part('notifications summary', getNotificationsSummary),
    part('activity', () => getActivity({ limit: 8 })),
    part('health', getSystemHealth),
    part('features', getFeaturesFresh),
    part('admin counts', getAdminCounts),
    part('support summary', getSupportSummary),
    getRoleAreas(),
  ]);

  return (
    <>
      <Typography variant='sectionHeading'>Super Admin</Typography>
      <Paper
        variant='panel'
        sx={{ maxWidth: theme.layout.width.page, minHeight: 0, alignItems: 'stretch', px: { xs: 2, md: 3 }, py: 3 }}
      >
        <HubView
          glance={glance}
          usage={usage}
          notifications={notifications}
          activity={activity}
          health={health}
          features={features}
          admins={admins}
          support={support}
          roleAreas={roleAreas}
          firstName={session.user.name?.split(' ')[0]}
        />
      </Paper>
    </>
  );
}
