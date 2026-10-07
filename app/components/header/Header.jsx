import { auth, signOut } from '@/auth';
import Image from 'next/image';

import { AppBar, Box, Toolbar } from '@mui/material';

import UserMenu from './UserMenu';

export default async function Header() {
  const session = await auth();

  // Passed down to the client-side menu, which posts its Sign out form here.
  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <AppBar>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <UserMenu user={session?.user} signOutAction={signOutAction} />

        <Box sx={{ position: 'relative', height: '2.4rem', width: '2.4rem' }}>
          <Image
            src='/slics-logo-dark.png'
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
