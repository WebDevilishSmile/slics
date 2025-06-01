import { Button, ButtonGroup, Typography } from '@mui/material';
import PageContainer from '../components/layout/PageContainer';
import { auth } from '@/auth';
import { getUserByEmail } from '@/utils/usersApi';
import RedirectMessage from './RedirectMessage';

async function AdminPage() {
  const session = await auth();

  if (!session) {
    // If the user is not authenticated, redirect them to the sign-in page
    return (
      <RedirectMessage
        message='You must be logged in to access this page.'
        redirect='/signin'
      />
    );
  }

  const user = await getUserByEmail(session?.user?.email);
  const isAdmin = session && user.role === 'admin';

  if (!isAdmin) {
    // If the user is not authenticated or not an admin, redirect them
    return (
      <RedirectMessage
        message='You must be an admin to access this page.'
        redirect='/signin'
      />
    );
  }

  return (
    <PageContainer>
      <Typography variant='h2'>Admin Page</Typography>

      <ButtonGroup variant='contained' sx={{ mt: '2rem' }}>
        <Button href='/admin/slics'>Slics</Button>
        <Button href='/admin/users'>Users</Button>
      </ButtonGroup>
    </PageContainer>
  );
}

export default AdminPage;
