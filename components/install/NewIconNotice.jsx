'use client';

import { useEffect, useState } from 'react';
import {
  AddBoxOutlined,
  IosShare,
  LanguageOutlined,
  RemoveCircleOutline,
} from '@mui/icons-material';
import {
  Button,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import { SITE_URL } from '@/constants';
import SlicsMark from '@/components/utility/SlicsMark';
import SoftNotice from '@/components/utility/SoftNotice';
import { softContainedSx, softPressSx } from '@/components/utility/soft';
import BottomSheetDialog, {
  BottomSheetActions,
} from '@/components/utility/BottomSheetDialog';

// The address to type in Safari: the short one, which redirects to SITE_URL.
// Not the page's own host, since older installs run on slics.vercel.app and
// a new one should be added from the app's real address.
const ADDRESS = new URL(SITE_URL).host.replace(/^www\./, '');

// An iPhone keeps the icon an app was added to the home screen with, and the
// only way to get the new one (ICON_CHANGED_AT in constants.js) is to remove
// the app and add it again. So the installed iPhone app shows this once on
// /home, until the driver dismisses it. `due` comes from the server
// (isIconNoticeDue): the dismissal lives on the account, because removing the
// app wipes its storage.
export default function NewIconNotice({ due }) {
  // Hidden until the device check runs, so it never flashes elsewhere.
  const [shown, setShown] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);

  useEffect(() => {
    if (!due) return;
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    // iPadOS reports itself as a Mac; the touch-point check tells them apart.
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setShown(standalone && isIos);
  }, [due]);

  const dismiss = () => {
    setShown(false);
    // Best effort: if it fails, the notice shows once more next visit.
    fetch('/api/users/me/icon-notice', { method: 'POST' }).catch(() => {});
  };

  const closeSteps = () => {
    setStepsOpen(false);
    dismiss();
  };

  const steps = [
    {
      icon: <RemoveCircleOutline />,
      primary: 'Remove SLICs from your home screen',
      secondary:
        'Touch and hold the SLICs icon, tap Remove App, then confirm. Your account, tips and history are kept.',
    },
    {
      icon: <LanguageOutlined />,
      primary: 'Open SLICs in Safari',
      secondary: `Go to ${ADDRESS}`,
    },
    {
      icon: <IosShare />,
      primary: 'Tap the Share button',
      secondary: "It's in the bar at the bottom of the screen.",
    },
    {
      icon: <AddBoxOutlined />,
      primary: 'Choose "Add to Home Screen", then Add',
      secondary: 'The new icon appears on your home screen.',
    },
  ];

  return (
    <>
      {shown && (
        <SoftNotice
          icon={<SlicsMark />}
          onClose={dismiss}
          closeLabel='Dismiss the new icon notice'
          sx={{ mb: 2 }}
          actions={
            <Button
              size='small'
              onClick={() => setStepsOpen(true)}
              aria-haspopup='dialog'
              sx={[softPressSx, { px: 1.5, minHeight: '2.5rem' }]}
            >
              Show me how
            </Button>
          }
        >
          SLICs has a new icon. To see it on your home screen, add the app
          again.
        </SoftNotice>
      )}

      <BottomSheetDialog
        open={stepsOpen}
        onClose={closeSteps}
        aria-labelledby='new-icon-title'
      >
        <DialogTitle id='new-icon-title'>Get the new SLICs icon</DialogTitle>
        <DialogContent>
          <List disablePadding>
            {steps.map((step, index) => (
              <ListItem key={step.primary} disableGutters alignItems='flex-start'>
                <ListItemIcon sx={{ mt: 0.5 }}>{step.icon}</ListItemIcon>
                <ListItemText
                  primary={`${index + 1}. ${step.primary}`}
                  secondary={step.secondary}
                />
              </ListItem>
            ))}
          </List>
          <DialogContentText sx={{ mt: 1 }}>
            You&apos;ll be asked to sign in again the first time you open it.
          </DialogContentText>
        </DialogContent>
        <BottomSheetActions>
          <Button
            variant='contained'
            size='large'
            onClick={closeSteps}
            sx={softContainedSx}
          >
            Got it
          </Button>
        </BottomSheetActions>
      </BottomSheetDialog>
    </>
  );
}
