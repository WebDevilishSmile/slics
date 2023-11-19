import { Avatar, List, ListItemIcon, Menu, MenuItem } from '@mui/material';
import Link from 'next/link';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';

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
    <Menu
      disableScrollLock
      anchorEl={anchorUser}
      open={openUser}
      onClose={handleUserClose}
    >
      {session ? (
        <List>
          <MenuItem component={Link} href="/" onClick={handleUserClose}>
            <ListItemIcon>
              <HomeOutlinedIcon />
            </ListItemIcon>
            Home
          </MenuItem>
          <MenuItem component={Link} onClick={handleUserClose} href="/profile">
            <ListItemIcon>
              <AccountCircleOutlinedIcon />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem component={Link} onClick={handleSignOut} href="/">
            <ListItemIcon>
              <ExitToAppOutlinedIcon />
            </ListItemIcon>
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
