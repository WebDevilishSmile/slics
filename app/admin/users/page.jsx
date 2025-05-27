import PageContainer from '@/app/components/layout/PageContainer';
import { getUsers } from '@/utils/usersApi';
import { Typography } from '@mui/material';

async function UsersPage() {
  const users = await getUsers();

  return (
    <PageContainer>
      <Typography variant='h2'>Users Page</Typography>
    </PageContainer>
  );
}

export default UsersPage;
