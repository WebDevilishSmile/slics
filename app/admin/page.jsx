import { Button, ButtonGroup, Typography } from '@mui/material';
import StyledHeading from '../components/layout/StyledHeading';

async function AdminPage() {
  return (
    <>
      <StyledHeading>Admin Page</StyledHeading>

      <ButtonGroup variant='contained' sx={{ mt: '2rem' }}>
        <Button href='/admin/slics'>Slics</Button>
        <Button href='/admin/users'>Users</Button>
      </ButtonGroup>
    </>
  );
}

export default AdminPage;
