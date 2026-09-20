'use client';

import { useEffect, useState } from 'react';
import { Close } from '@mui/icons-material';
import { Alert, Button, IconButton } from '@mui/material';

import theme from '@/utils/theme';
import { useInstallPrompt, useIsMobile } from '@/utils/clientFunctions';

import IosInstallDialog from './IosInstallDialog';

// Per-viewer convenience only (see the privacy policy's local-storage note);
// the header menu keeps install reachable regardless of this.
const STORAGE_KEY = 'slics-install-nudge-dismissed';
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

const readDismissed = () => {
  try {
    const dismissedAt = Date.parse(localStorage.getItem(STORAGE_KEY) ?? '');
    return Date.now() - dismissedAt < SNOOZE_MS;
  } catch {
    return false;
  }
};

const writeDismissed = () => {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    // Storage blocked (private mode etc.) — the nudge just returns next visit.
  }
};

// One-time, phone-only prompt at the top of /home. Inline rather than a
// Snackbar: the theme anchors Snackbars top-center (over the search field)
// and ModeSwitch owns the bottom-right corner.
function InstallNudge() {
  const { canInstall, platform, promptInstall } = useInstallPrompt();
  const isMobile = useIsMobile();
  // Start hidden so a dismissed nudge never flashes before storage is read.
  const [dismissed, setDismissed] = useState(true);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  if (!canInstall || !isMobile || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    writeDismissed();
  };

  const handleAction = async () => {
    if (platform === 'ios') {
      setIosOpen(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome !== 'accepted') dismiss();
  };

  return (
    <>
      <Alert
        severity='info'
        sx={{ maxWidth: theme.layout.width.panel, width: '100%', mb: 2 }}
        action={
          <>
            <Button color='inherit' size='small' onClick={handleAction}>
              {platform === 'ios' ? 'Show me how' : 'Install'}
            </Button>
            <IconButton
              color='inherit'
              size='small'
              onClick={dismiss}
              aria-label='Dismiss'
            >
              <Close fontSize='inherit' />
            </IconButton>
          </>
        }
      >
        Add SLICs to your home screen for one-tap access.
      </Alert>

      <IosInstallDialog
        open={iosOpen}
        onClose={() => {
          setIosOpen(false);
          dismiss();
        }}
      />
    </>
  );
}

export default InstallNudge;
