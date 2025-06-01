import { Button, ButtonGroup, Typography } from '@mui/material';

async function AdminPage() {
  return (
    <>
      <Typography variant='h2'>Admin Page</Typography>

      <ButtonGroup variant='contained' sx={{ mt: '2rem' }}>
        <Button href='/admin/slics'>Slics</Button>
        <Button href='/admin/users'>Users</Button>
      </ButtonGroup>
    </>
  );
}

export default AdminPage;
