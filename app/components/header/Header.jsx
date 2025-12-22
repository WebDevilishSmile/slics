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
          {session?.user?.role === 'admin' && (
            <>
              <ListItem>
                <Button href='/admin'>Admin</Button>
              </ListItem>
              {/* <ListItem>
                <Button href='/covers'>Covers</Button>
              </ListItem> */}
            </>
          )}
          {session?.user ? (
            <ListItem
              component='form'
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <Button type='submit'>Sign Out</Button>
            </ListItem>
          ) : (
            <ListItem>
              <Button href='/'>Sign In</Button>
            </ListItem>
          )}
        </UserMenu>

        <Box sx={{ position: 'relative', height: '2.4rem', width: '2.4rem' }}>
          <Image
            src='/slics_logo_dark.png'
            fill
            style={{ objectFit: 'contain' }}
            alt='SLICs Logo'
            sizes='(max-width: 600px) 2.4rem, 2.4rem'
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
