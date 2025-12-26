'use client';

import { IconButton, useColorScheme } from '@mui/material';

import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';

function ModeSwitch() {
  const { setMode, mode, colorScheme } = useColorScheme();
  if (!mode) {
    return null;
  }

  function toggleMode(mode) {
    if (mode === 'system' && colorScheme === 'dark') {
      setMode('light');
    }
    if (mode === 'system' && colorScheme === 'light') {
      setMode('dark');
    } else if (mode === 'light') {
      setMode('dark');
    } else if (mode === 'dark') {
      setMode('light');
    }
  }

  return (
    <IconButton
      size='large'
      onClick={() => toggleMode(mode)}
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
