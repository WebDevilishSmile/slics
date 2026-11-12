import { signOut } from '@/auth';
import { getCreatorMode, getSession, isSuperAdmin } from '@/lib/authz';
import { creatorUser } from '@/lib/creatorData';

import { Toolbar } from '@mui/material';

import HeaderBar from './HeaderBar';

export default async function Header() {
  const session = await getSession();
  // Creator mode (docs/CREATOR-MODE.md) shows the menu as a made-up driver's.
  // `creatorMode` is null for anyone who can't use it, else whether it's on.
  const creatorMode = isSuperAdmin(session) ? await getCreatorMode(session) : null;
  const user = creatorMode ? creatorUser(session.user) : session?.user;

  // Passed down to the client-side menu, which posts its Sign out form here.
  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <>
      <HeaderBar
        user={user}
        features={session?.features}
        creatorMode={creatorMode}
        signOutAction={signOutAction}
      />
      {/* The AppBar is position: fixed, so it takes no room in the page. This
          empty Toolbar does, at the toolbar's own responsive height (56px on
          phones), so pages start just below the header (UI-SUGGESTIONS.md #37). */}
      <Toolbar className='no-print' />
    </>
  );
}
