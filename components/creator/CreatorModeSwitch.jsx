'use client';

import { VideocamOutlined } from '@mui/icons-material';
import { Box, ListItem, ListItemIcon, ListItemText, Switch } from '@mui/material';

import { setCreatorCookie } from '@/lib/creatorMode';

// The "Creator mode" row in the header menu (header/UserMenu.jsx), for the
// super admin, under Dark mode and built like it: the whole row is a <label>.
// Flipping it sets the cookie and opens /home, where the made-up data starts
// (or stops) with a fresh page (docs/CREATOR-MODE.md).
export default function CreatorModeSwitch({ on }) {
  const toggle = () => {
    setCreatorCookie(!on);
    window.location.assign('/home');
  };

  return (
    <ListItem disablePadding>
      <Box
        component='label'
        sx={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          minHeight: '3rem',
          mx: 1.5,
          px: 2,
          cursor: 'pointer',
        }}
      >
        <ListItemIcon>
          <VideocamOutlined />
        </ListItemIcon>
        <ListItemText
          primary='Creator mode'
          secondary={on ? 'Made-up SLICs on · off in 12 h' : 'Made-up SLICs for videos'}
        />
        <Switch edge='end' checked={on} onChange={toggle} />
      </Box>
    </ListItem>
  );
}
