import { toAdminUser } from '@/lib/serializers';
import { getPasswordUserIds, getSlicViewCounts, getUsers } from '@/lib/db/users';
import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession } from '@/lib/authz';

import UserList from '@/components/admin/users/UserList';
import { Typography } from '@mui/material';
import HydrationGuard from '@/components/utility/HydrationGuard';

async function UsersPage() {
  if (!(await getAreaSession('users'))) return <NoAccess />;

  const [users, viewCounts, passwordIds] = await Promise.all([
    getUsers(),
    getSlicViewCounts(),
    getPasswordUserIds(),
  ]);
  // `hasPassword` puts "Reset password" on the card (docs/PASSWORD-RESET.md);
  // only the flag, never the hash.
  const rows = users.map((user) => ({
    ...toAdminUser(user),
    hasPassword: passwordIds.has(user._id.toString()),
  }));

  return (
    <>
      <Typography variant='sectionHeading'>Users</Typography>

      <HydrationGuard>
        <UserList users={rows} viewCounts={viewCounts} />
      </HydrationGuard>
    </>
  );
}

export default UsersPage;
