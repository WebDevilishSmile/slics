import UserCard from '@/app/components/admin/UserCard';
import BackButton from '@/app/components/layout/BackButton';
import { getUsers } from '@/utils/usersApi';
import { ELEVATION, MAX_WIDTH } from '@/utils/variables';
import { Box, Card, CardContent, List, Paper, Typography } from '@mui/material';
import dayjs from 'dayjs';
import Image from 'next/image';

async function UsersPage() {
  const users = await getUsers();

  return (
    <>
      <BackButton />
      <Typography variant='h2'>Users Page</Typography>

      <List sx={{ maxWidth: MAX_WIDTH, width: '100%', mt: '2rem' }}>
        {users.map((user) => (
          <UserCard key={user._id} user={user} />
        ))}
      </List>
    </>
  );
}

export default UsersPage;
