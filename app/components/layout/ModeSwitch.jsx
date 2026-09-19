'use client';

import { IconButton, useColorScheme } from '@mui/material';

import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';

function ModeSwitch() {
  const { setMode, mode, colorScheme } = useColorScheme();
  if (!mode) {
    return null;
  }

  // colorScheme is the *resolved* scheme ('light' | 'dark'), so this also
  // covers mode === 'system': the toggle always flips whatever is on screen
  // and pins the result as an explicit mode.
  const toggleMode = () => setMode(colorScheme === 'dark' ? 'light' : 'dark');

  return (
    <IconButton
      size='large'
      onClick={toggleMode}
      sx={{
        zIndex: 2000,
        position: 'fixed',
        bottom: '2rem',
        right: '1.5rem',
        justifySelf: 'flex-end',
        color: 'text.opposite',
        bgcolor: 'background.opposite',
        opacity: '40%',
        '&:hover': { bgcolor: 'background.opposite', opacity: '50%' },
      }}
    >
      {colorScheme === 'light' ? <DarkModeOutlined /> : <LightModeOutlined />}
    </IconButton>
  );
}

export default ModeSwitch;
