import { serializeUsers } from '@/utils/functions';
import { getSlicViewCounts, getUsers } from '@/utils/usersApi';

import UserList from '@/app/components/admin/users/UserList';
import BackButton from '@/app/components/layout/BackButton';
import StyledHeading from '@/app/components/layout/StyledHeading';
import HydrationGuard from '@/app/components/utility/HydrationGuard';

async function UsersPage() {
  const [users, viewCounts] = await Promise.all([getUsers(), getSlicViewCounts()]);

  return (
    <>
      <BackButton />
      <StyledHeading>Users Page</StyledHeading>

      <HydrationGuard>
        <UserList users={serializeUsers(users)} viewCounts={viewCounts} />
      </HydrationGuard>
    </>
  );
}

export default UsersPage;
