'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { NotificationsActive, NotificationsNoneOutlined } from '@mui/icons-material';
import { Box, Button, CircularProgress } from '@mui/material';

import { PUSH_OPEN } from '@/constants';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { tapHaptic } from '@/lib/haptics';

import SoftNotice from '@/components/utility/SoftNotice';
import { softInset, softPressSx } from '@/components/utility/soft';

const DISMISSED_KEY = 'slics.pushNudgeDismissed';

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    // Private mode or blocked storage: it just shows again next post.
  }
}

// "Get a notification when someone replies", offered right after a driver
// posts a tip, a reply or a place comment (docs/PUSH-NOTIFICATIONS.md, stage
// 2.5), never on page load. The parent mounts it only after a post, so the
// hook's check runs only then; the hook never registers the service worker
// on its own, only `enable()` inside the tap does. Shown to whoever
// `canUsePush` lets in (lib/authz.js), while this device is off and until
// they dismiss it on this device. A blocked, unsupported or iPhone-tab device
// is left to /profile, which explains each. Turning on confirms in place.
// `inset` draws it as a pressed-in well, for inside a raised card (a place's).
export default function PushNudge({ inset = false }) {
  const { data: session } = useSession();
  const { state, busy, enable } = usePushNotifications();
  const [dismissed, setDismissed] = useState(readDismissed);
  // Set by the tap: what it led to stays on screen until dismissed.
  const [result, setResult] = useState(null); // null | 'on' | 'blocked' | 'error'

  const user = session?.user;
  const canUsePush =
    Boolean(user?.id) && ((session?.features?.pushOpen ?? PUSH_OPEN) || user.role === 'admin');
  if (!canUsePush || dismissed) return null;
  if (!result && state !== 'off') return null;

  const dismiss = () => {
    writeDismissed();
    setDismissed(true);
  };

  const turnOn = async () => {
    const { error } = await enable();
    if (error) return setResult('error');
    if (Notification.permission === 'granted') {
      tapHaptic();
      setResult('on');
    } else if (Notification.permission === 'denied') {
      setResult('blocked');
    }
    // 'default': the prompt was closed without an answer; the button stays.
  };

  const message = {
    on: 'Notifications on. You’ll get one when someone replies.',
    blocked: 'Notifications are blocked on this device. Profile → Notifications says how to allow them.',
    error: 'Couldn’t turn notifications on. Try again from Profile → Notifications.',
  }[result] ?? 'Get a notification when someone replies.';

  return (
    <SoftNotice
      icon={result === 'on' ? <NotificationsActive className='pop' /> : <NotificationsNoneOutlined />}
      onClose={dismiss}
      closeLabel='Dismiss the notifications suggestion'
      sx={[{ maxWidth: 'none' }, inset && softInset]}
      actions={
        result ? null : (
          <Button
            size='small'
            onClick={turnOn}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={14} color='inherit' /> : null}
            sx={[softPressSx, { px: 1.5, minHeight: '2.5rem' }]}
          >
            Turn on
          </Button>
        )
      }
    >
      {/* SoftNotice is a polite status region, so the change is read out. */}
      <Box component='span'>{message}</Box>
    </SoftNotice>
  );
}
