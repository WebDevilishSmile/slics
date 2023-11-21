'use client';

import { useState } from 'react';

import theme from '../utilities/theme';

import { AppBar, Avatar, IconButton, Toolbar, Typography } from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';

import HeaderUser from './HeaderUser';
import HeaderLinks from './HeaderLinks';

export default function Header({ data }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorUser, setAnchorUser] = useState(null);
  const open = Boolean(anchorEl);
  const openUser = Boolean(anchorUser);

  const session = data.session;
  const user = data.session?.user;
  const userName = session?.user.user_metadata.name.split(' ')[0];

  const handleClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleUserClick = (e) => {
    setAnchorUser(e.currentTarget);
  };

  return (
    <AppBar sx={{ backgroundColor: theme.palette.primary.dark }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <IconButton onClick={handleUserClick}>
          {session ? (
            <Avatar src={`${user?.user_metadata.avatar_url}`} />
          ) : (
            <Avatar />
          )}
        </IconButton>
        <HeaderUser
          anchorUser={anchorUser}
          setAnchorUser={setAnchorUser}
          openUser={openUser}
          session={session}
        />
        <Typography sx={{ textTransform: 'uppercase', color: '#f7f7f7' }}>
          {session ? `Hello ${userName}` : 'Please Login'}
        </Typography>

        <IconButton
          sx={{ color: theme.palette.primary.light }}
          onClick={handleClick}
        >
          <MenuIcon />
        </IconButton>
        <HeaderLinks
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          open={open}
        />
      </Toolbar>
    </AppBar>
  );
}
