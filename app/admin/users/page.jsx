import UserList from '@/app/components/admin/UserList';
import BackButton from '@/app/components/layout/BackButton';
import StyledHeading from '@/app/components/layout/StyledHeading';
import { serializeUsers } from '@/utils/functions';
import { getUsers } from '@/utils/usersApi';

async function UsersPage() {
  const users = await getUsers();

  return (
    <>
      <BackButton />
      <StyledHeading>Users Page</StyledHeading>

      <UserList users={serializeUsers(users)} />
    </>
  );
}

export default UsersPage;
