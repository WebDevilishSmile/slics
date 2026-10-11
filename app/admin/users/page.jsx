import { toAdminUser } from '@/lib/serializers';
import { getSlicViewCounts, getUsers } from '@/lib/db/users';
import { getAdminSession } from '@/lib/authz';

import UserList from '@/components/admin/users/UserList';
import { Typography } from '@mui/material';
import HydrationGuard from '@/components/utility/HydrationGuard';

async function UsersPage() {
  if (!(await getAdminSession())) return null;

  const [users, viewCounts] = await Promise.all([getUsers(), getSlicViewCounts()]);

  return (
    <>
      <Typography variant='sectionHeading'>Users</Typography>

      <HydrationGuard>
        <UserList users={users.map(toAdminUser)} viewCounts={viewCounts} />
      </HydrationGuard>
    </>
  );
}

export default UsersPage;
