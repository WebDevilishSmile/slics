import { toAdminUser } from '@/lib/serializers';
import { getPasswordUserIds, getSlicViewCounts, getUsers } from '@/lib/db/users';
import { getFeatures, getRoleAreas } from '@/lib/db/appSettings';
import { areasFor } from '@/lib/staffAreas';
import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession } from '@/lib/authz';

import UserList from '@/components/admin/users/UserList';
import { Typography } from '@mui/material';
import HydrationGuard from '@/components/utility/HydrationGuard';

async function UsersPage() {
  if (!(await getAreaSession('users'))) return <NoAccess />;

  const [users, viewCounts, passwordIds, roleAreas, features] = await Promise.all([
    getUsers(),
    getSlicViewCounts(),
    getPasswordUserIds(),
    getRoleAreas(),
    getFeatures(),
  ]);
  // `hasPassword` puts "Reset password" on the card (docs/PASSWORD-RESET.md);
  // only the flag, never the hash. `coversByRole`: their role has the Covers
  // tool, so Covers early access is theirs already (UserCoversAccess).
  const rows = users.map((user) => ({
    ...toAdminUser(user),
    hasPassword: passwordIds.has(user._id.toString()),
    coversByRole: areasFor(user, roleAreas).includes('covers'),
  }));

  return (
    <>
      <Typography variant='sectionHeading'>Users</Typography>

      <HydrationGuard>
        <UserList users={rows} viewCounts={viewCounts} coversOpen={features.coversOpen} />
      </HydrationGuard>
    </>
  );
}

export default UsersPage;
