'use client';

import { useState } from 'react';
import { Button, ListItem } from '@mui/material';

import { useInstallPrompt } from '@/utils/clientFunctions';

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
      <ListItem>
        <Button onClick={handleClick}>Install app</Button>
      </ListItem>

      <IosInstallDialog open={iosOpen} onClose={() => setIosOpen(false)} />
    </>
  );
}

export default InstallMenuItem;
