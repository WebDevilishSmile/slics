import BackButton from '@/app/components/layout/BackButton';
import PageContainer from '@/app/components/layout/PageContainer';
import { getUsers } from '@/utils/usersApi';
import { List, ListItem, Typography } from '@mui/material';

async function UsersPage() {
  const users = await getUsers();

  return (
    <PageContainer>
      <BackButton />
      <Typography variant='h2'>Users Page</Typography>

      <List sx={{ fontSize: '1.4rem' }}>
        {users.map((user) => (
          <ListItem key={user._id}>
            {user.name} - {user.role}
          </ListItem>
        ))}
      </List>
    </PageContainer>
  );
}

export default UsersPage;
