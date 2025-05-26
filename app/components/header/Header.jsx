import { auth, signIn, signOut } from '@/auth';
import Image from 'next/image';

import { AppBar, Box, Button, ListItem, Toolbar } from '@mui/material';

import UserMenu from './UserMenu';

export default async function Header() {
  const session = await auth();

  return (
    <AppBar>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                await signIn('google', { redirectTo: '/' });
              }}
            >
              <Button type='submit'>Sign In</Button>
            </ListItem>
          )}
          {session?.user?.role === 'admin' && (
            <ListItem>
              <Button>Admin</Button>
            </ListItem>
          )}
        </UserMenu>

        <Box sx={{ position: 'relative', height: '5rem', width: '5rem' }}>
          <Image
            src='/slics_logo_only.png'
            fill
            style={{ objectFit: 'contain' }}
            alt='SLICs Logo'
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
