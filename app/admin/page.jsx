import { Button, ButtonGroup, Typography } from '@mui/material';

import HomeButton from '../components/layout/HomeButton';

async function AdminPage() {
  return (
    <>
      <Typography variant='sectionHeading'>Admin Page</Typography>
      <HomeButton />

      <ButtonGroup variant='contained' sx={{ mt: 4 }}>
        <Button href='/admin/slics'>Slics</Button>
        <Button href='/admin/comments'>Comments</Button>
        <Button href='/admin/users'>Users</Button>
      </ButtonGroup>
      <ButtonGroup variant='contained' sx={{ mt: 4 }}>
        <Button href='/admin/cover/drivers'>Cover Drivers</Button>
        <Button href='/admin/cover/jobs'>Cover Jobs</Button>
      </ButtonGroup>
      <ButtonGroup variant='contained' sx={{ mt: 4 }}>
        <Button href='/admin/drivers'>Drivers</Button>
      </ButtonGroup>
    </>
  );
}

export default AdminPage;
