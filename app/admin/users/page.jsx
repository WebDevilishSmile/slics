import { serializeUsers } from '@/utils/functions';
import { getUsers } from '@/utils/usersApi';

import UserList from '@/app/components/admin/users/UserList';
import BackButton from '@/app/components/layout/BackButton';
import StyledHeading from '@/app/components/layout/StyledHeading';
import HydrationGuard from '@/app/components/utility/HydrationGuard';

async function UsersPage() {
  const users = await getUsers();

  return (
    <>
      <BackButton />
      <StyledHeading>Users Page</StyledHeading>

      <HydrationGuard>
        <UserList users={serializeUsers(users)} />
      </HydrationGuard>
    </>
  );
}

export default UsersPage;
