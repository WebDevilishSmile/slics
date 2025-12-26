import { Button, ButtonGroup, Typography } from '@mui/material';

import StyledHeading from '../components/layout/StyledHeading';
import HomeButton from '../components/layout/HomeButton';

async function AdminPage() {
  return (
    <>
      <StyledHeading>Admin Page</StyledHeading>
      <HomeButton />

      <ButtonGroup variant='contained' sx={{ mt: '2rem' }}>
        <Button href='/admin/slics'>Slics</Button>
        <Button href='/admin/comments'>Comments</Button>
        <Button href='/admin/users'>Users</Button>
      </ButtonGroup>
      <ButtonGroup variant='contained' sx={{ mt: '2rem' }}>
        <Button href='/admin/cover/drivers'>Cover Drivers</Button>
        <Button href='/admin/cover/jobs'>Cover Jobs</Button>
      </ButtonGroup>
      <ButtonGroup variant='contained' sx={{ mt: '2rem' }}>
        <Button href='/admin/drivers'>Drivers</Button>
      </ButtonGroup>
    </>
  );
}

export default AdminPage;
