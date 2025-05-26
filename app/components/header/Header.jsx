import { AppBar, Button, ListItem, Toolbar, Typography } from '@mui/material';
import UserMenu from './UserMenu';
import { auth, signIn, signOut } from '@/auth';

export default async function Header() {
  const session = await auth();

  return (
    <AppBar>
      <Toolbar>
        <UserMenu user={session?.user}>
          {session?.user ? (
            <ListItem
              component='form'
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/signin' });
              }}
            >
              <Button type='submit'>Sign Out</Button>
            </ListItem>
          ) : (
            <ListItem
              component='form'
              action={async () => {
                'use server';
                await signIn('google');
              }}
            >
              <Button type='submit'>Sign In</Button>
            </ListItem>
          )}
        </UserMenu>

        <Typography>Header</Typography>
      </Toolbar>
    </AppBar>
  );
}
