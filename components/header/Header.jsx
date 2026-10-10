import { signOut } from '@/auth';
import { getSession } from '@/lib/authz';

import { Toolbar } from '@mui/material';

import HeaderBar from './HeaderBar';

export default async function Header() {
  const session = await getSession();

  // Passed down to the client-side menu, which posts its Sign out form here.
  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <>
      <HeaderBar user={session?.user} signOutAction={signOutAction} />
      {/* The AppBar is position: fixed, so it takes no room in the page. This
          empty Toolbar does, at the toolbar's own responsive height (56px on
          phones), so pages start just below the header (UI-SUGGESTIONS.md #37). */}
      <Toolbar />
    </>
  );
}
