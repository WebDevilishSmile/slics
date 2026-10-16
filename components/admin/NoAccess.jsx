import { Button, Paper, Typography } from '@mui/material';

import { softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { getSession } from '@/lib/authz';
import theme from '@/theme';

// What an admin page shows a staff account without its area
// (docs/STAFF-ROLES.md). The /admin layout lets every staff account in, and
// each page checks its own area (getAreaSession, lib/authz.js), so this is
// where a dispatcher lands on a tool their role doesn't have. It points back
// to the hub they do have.
export default async function NoAccess() {
  const session = await getSession();
  const hub =
    session?.user?.role === 'dispatch'
      ? { href: '/dispatch', label: 'Back to Dispatch' }
      : { href: '/admin', label: 'Back to Admin' };

  return (
    <>
      <Typography variant='sectionHeading'>No access</Typography>
      <Paper
        variant='panel'
        className='enter'
        sx={{ minHeight: 0, gap: 3, textAlign: 'center', maxWidth: theme.layout.width.prose }}
      >
        <Typography>
          This tool isn&apos;t turned on for your role. A super admin chooses which tools each
          role can use.
        </Typography>
        <Button
          href={hub.href}
          sx={[softRaisedSmall(theme), softPressSx(theme), { px: 3, minHeight: '3rem' }]}
        >
          {hub.label}
        </Button>
      </Paper>
    </>
  );
}
