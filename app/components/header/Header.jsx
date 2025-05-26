import { AppBar, Button, ListItem, Toolbar, Typography } from '@mui/material';
import UserMenu from './UserMenu';
import { auth } from '@/auth';

export default async function Header() {
  const session = auth();

  return (
    <AppBar>
      <Toolbar>
        <UserMenu>
          <ListItem
            component='form'
            action={async () => {
              'use server';
              console.log('SIGN IN');
            }}
          >
            <Button type='submit'>Sign In</Button>
          </ListItem>
        </UserMenu>

        <Typography>Header</Typography>
      </Toolbar>
    </AppBar>
  );
}
