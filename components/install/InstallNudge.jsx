'use client';

import { useEffect, useState } from 'react';
import { InstallMobileOutlined } from '@mui/icons-material';
import { Button, useMediaQuery } from '@mui/material';

import theme from '@/theme';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx } from '@/components/utility/soft';
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
// Snackbar: the theme anchors Snackbars top-center, over the search field.
function InstallNudge() {
  const { canInstall, platform, promptInstall } = useInstallPrompt();
  // Phones in portrait — the theme's own breakpoint, not a private one (#29).
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      <SoftNotice
        icon={<InstallMobileOutlined />}
        onClose={dismiss}
        sx={{ mb: 2 }}
        actions={
          <Button
            size='small'
            onClick={handleAction}
            sx={[softPressSx, { px: 1.5, minHeight: '2.5rem' }]}
          >
            {platform === 'ios' ? 'Show me how' : 'Install'}
          </Button>
        }
      >
        Add SLICs to your home screen for one-tap access.
      </SoftNotice>

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
