'use client';

import { DarkModeOutlined } from '@mui/icons-material';
import {
  Box,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  useColorScheme,
} from '@mui/material';

// The "Dark mode" row in the header menu (header/UserMenu.jsx). It replaced a
// floating bottom-right toggle that sat on top of page text and dialogs
// (UI-SUGGESTIONS.md #34). The whole row is a <label>, so a tap anywhere on it
// flips the switch — no small target to hunt for.
function ModeSwitch() {
  const { setMode, mode, colorScheme } = useColorScheme();
  if (!mode) {
    return null;
  }

  // colorScheme is the *resolved* scheme ('light' | 'dark'), so this also
  // covers mode === 'system': the switch always flips whatever is on screen
  // and pins the result as an explicit mode.
  const isDark = colorScheme === 'dark';
  const toggleMode = () => setMode(isDark ? 'light' : 'dark');

  return (
    <ListItem disablePadding>
      <Box
        component='label'
        sx={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          minHeight: '3rem',
          // Lined up with the soft menu rows above it (utility/soft.js).
          mx: 1.5,
          px: 2,
          cursor: 'pointer',
        }}
      >
        <ListItemIcon>
          <DarkModeOutlined />
        </ListItemIcon>
        <ListItemText primary='Dark mode' />
        <Switch edge='end' checked={isDark} onChange={toggleMode} />
      </Box>
    </ListItem>
  );
}

export default ModeSwitch;
