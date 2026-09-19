'use client';

import { MoreVert } from '@mui/icons-material';
import { Button, IconButton, Menu, MenuItem } from '@mui/material';
import Link from 'next/link';
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
        aria-label={`Options for ${user.name || user.email}`}
      >
        <MoreVert />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem>Toggle Membership</MenuItem>
        <MenuItem component={Button} href={`/admin/users/${user._id}`}>
          More...
        </MenuItem>
      </Menu>
    </>
  );
}

export default UserCardActions;
