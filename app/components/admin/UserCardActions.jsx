'use client';

import { MoreVert } from '@mui/icons-material';
import { Button, IconButton, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

function UserCardActions({ user }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        sx={{ position: 'absolute', top: '1rem', right: '1rem' }}
        onClick={handleMenuOpen}
      >
        <MoreVert />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem>Admin</MenuItem>
        <MenuItem>User</MenuItem>
      </Menu>
    </>
  );
}

export default UserCardActions;
