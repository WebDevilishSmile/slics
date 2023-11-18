import { List, Menu, MenuItem } from '@mui/material';
import Link from 'next/link';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function HeaderUser({
  anchorUser,
  setAnchorUser,
  openUser,
  session,
}) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleUserClose = () => {
    setAnchorUser(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    handleUserClose();
    router.refresh();
  };

  return (
    <Menu anchorEl={anchorUser} open={openUser} onClose={handleUserClose}>
      {session ? (
        <List>
          <MenuItem component={Link} onClick={handleUserClose} href="/">
            Home
          </MenuItem>
          <MenuItem component={Link} onClick={handleUserClose} href="/profile">
            Profile
          </MenuItem>
          <MenuItem component={Link} onClick={handleSignOut} href="/">
            Sign Out
          </MenuItem>
        </List>
      ) : (
        <MenuItem component={Link} href="/login" onClick={handleUserClose}>
          Login
        </MenuItem>
      )}
    </Menu>
  );
}
