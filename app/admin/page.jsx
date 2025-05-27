import { Button, ButtonGroup, Typography } from '@mui/material';
import PageContainer from '../components/layout/PageContainer';

function AdminPage() {
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
