import UserCard from '@/app/components/admin/UserCard';
import BackButton from '@/app/components/layout/BackButton';
import StyledHeading from '@/app/components/layout/StyledHeading';
import { serializeUser } from '@/utils/functions';
import { getUsers } from '@/utils/usersApi';
import { MAX_WIDTH } from '@/utils/variables';
import { List } from '@mui/material';

async function UsersPage() {
  const users = await getUsers();

  return (
    <>
      <BackButton />
      <StyledHeading>Users Page</StyledHeading>

      <List
        sx={{ maxWidth: MAX_WIDTH, width: '100%', minWidth: 0, mt: '2rem' }}
      >
        {users.map((user) => (
          <UserCard key={user._id} user={serializeUser(user)} />
        ))}
      </List>
    </>
  );
}

export default UsersPage;
