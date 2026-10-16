import { Paper, Typography } from '@mui/material';

import StaffHub from '@/components/admin/StaffHub';
import PageContainer from '@/components/layout/PageContainer';
import RedirectMessage from '@/components/layout/RedirectMessage';
import SoftNotice from '@/components/utility/SoftNotice';
import { areasOf, getSession, isSuperAdmin } from '@/lib/authz';
import { getRoleAreas } from '@/lib/db/appSettings';
import { areasFor } from '@/lib/staffAreas';
import theme from '@/theme';

export const metadata = {
  title: 'Dispatch · SLICs',
};

// The Dispatch role's hub (docs/STAFF-ROLES.md): the tools the super admin
// turned on for Dispatch on /admin/super/admins, SLICs by default. Those
// tools are the admin pages themselves (/admin/slics and so on), which check
// each area. A super admin sees it too, as Dispatch sees it.
export default async function DispatchPage() {
  const session = await getSession();
  if (!session) {
    return <RedirectMessage heading='You must be logged in to view Dispatch.' redirect='/sign-in' />;
  }

  const superAdmin = isSuperAdmin(session);
  if (session.user.role !== 'dispatch' && !superAdmin) {
    return (
      <RedirectMessage
        heading='This page is for Dispatch.'
        subheading='Redirecting you to the home page…'
        redirect='/home'
      />
    );
  }

  // A dispatcher's own tools; for a super admin, the Dispatch role's.
  const areas = superAdmin
    ? areasFor({ role: 'dispatch' }, await getRoleAreas())
    : areasOf(session);

  return (
    <PageContainer>
      <Typography variant='sectionHeading'>Dispatch</Typography>

      <Paper variant='panel' sx={{ gap: 3 }}>
        {superAdmin && (
          <SoftNotice>
            This is what Dispatch sees. Choose its tools on the Admins page under Super Admin.
          </SoftNotice>
        )}
        {areas.length > 0 ? (
          <StaffHub areas={areas} userId={session.user.id} label='Dispatch tools' />
        ) : (
          <Typography
            color='text.secondary'
            sx={{ textAlign: 'center', maxWidth: theme.layout.width.field }}
          >
            No tools are turned on for Dispatch yet. A super admin chooses them.
          </Typography>
        )}
      </Paper>
    </PageContainer>
  );
}
