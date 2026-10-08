'use client';

import { useState } from 'react';
import { InstallMobileOutlined } from '@mui/icons-material';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import { useInstallPrompt } from '@/hooks/useInstallPrompt';

import { softListItemSx } from '../utility/soft';

import IosInstallDialog from './IosInstallDialog';

// Lives in the header menu so install stays discoverable after the one-time
// nudge on /home has been dismissed. Renders nothing once installed.
function InstallMenuItem() {
  const { canInstall, platform, promptInstall } = useInstallPrompt();
  const [iosOpen, setIosOpen] = useState(false);

  if (!canInstall) return null;

  const handleClick = () => {
    if (platform === 'ios') {
      setIosOpen(true);
    } else {
      promptInstall();
    }
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={handleClick}
          sx={[softListItemSx, { minHeight: '3rem' }]}
        >
          <ListItemIcon>
            <InstallMobileOutlined />
          </ListItemIcon>
          <ListItemText primary='Install app' />
        </ListItemButton>
      </ListItem>

      <IosInstallDialog open={iosOpen} onClose={() => setIosOpen(false)} />
    </>
  );
}

export default InstallMenuItem;
