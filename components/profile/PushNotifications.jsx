'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircleOutline,
  NotificationsActive,
  NotificationsOffOutlined,
  SendOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, Skeleton, Switch, Typography } from '@mui/material';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';

import IosInstallDialog from '@/components/install/IosInstallDialog';
import { softInset, softPressSx, softRaisedSmall } from '@/components/utility/soft';
import PushTypeSwitches from './PushTypeSwitches';

const SENT_FEEDBACK_MS = 2500;

const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
  padding: 0,
  margin: '-1px',
};

// What each state that can't simply be switched on says under the switch.
const NOTES = {
  unsupported: "This browser can't show notifications. Chrome, Edge, Firefox and Safari can.",
  'needs-install':
    'On an iPhone, notifications only work in the app added to your home screen. Add it, open SLICs from there, and turn them on.',
  blocked:
    "Notifications are blocked for SLICs on this device. On Android, tap the icon left of the address bar and allow them. On an iPhone, go to Settings → Notifications → SLICs. Then reload this page.",
};

// The notifications switch on /profile (docs/PUSH-NOTIFICATIONS.md), for
// whoever `canUsePush` lets in: this device on or off. A pressed-in well like the details
// above it. Once it's on, "Send a test" and the kinds to send
// (PushTypeSwitches, per account; `prefs` from the page, or null to hide
// them; `reminderLeads`, a verified driver's call-in reminder times). Confirms
// in place (the button and a live region), not with a toast.
export default function PushNotifications({ prefs = null, reminderLeads = null }) {
  const { state, busy, enable, disable } = usePushNotifications();
  const [error, setError] = useState(null);
  const [iosOpen, setIosOpen] = useState(false);
  // 'idle' | 'sending' | 'sent'
  const [testState, setTestState] = useState('idle');
  const [announcement, setAnnouncement] = useState('');
  const resetTimer = useRef(null);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const on = state === 'on';
  const canToggle = state === 'on' || state === 'off';

  // Set by a tap, so the live region speaks after the switch settles, never
  // on page load.
  const toggled = useRef(false);

  const handleToggle = async () => {
    setError(null);
    toggled.current = true;
    const result = on ? await disable() : await enable();
    if (result.error) {
      setError(result.error);
      return;
    }
    tapHaptic();
  };

  useEffect(() => {
    if (!toggled.current) return;
    if (state === 'on') setAnnouncement('Notifications on');
    else if (state === 'off') setAnnouncement('Notifications off');
    else if (state === 'blocked') setAnnouncement('Notifications blocked');
  }, [state]);

  const handleTest = async () => {
    setError(null);
    setTestState('sending');
    clearTimeout(resetTimer.current);
    const { data, error: testError } = await apiRequest('/api/users/me/push-test');
    if (testError || !data?.data?.sent) {
      setTestState('idle');
      setError(testError || "The test didn't go out. Turn notifications off and on again.");
      return;
    }
    setTestState('sent');
    setAnnouncement('Test sent');
    tapHaptic();
    resetTimer.current = setTimeout(() => setTestState('idle'), SENT_FEEDBACK_MS);
  };

  return (
    <Box
      sx={[
        softInset,
        {
          alignSelf: 'stretch',
          borderRadius: 4,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        },
      ]}
    >
      {/* The whole row is the label, so a tap anywhere flips the switch. */}
      <Box
        component='label'
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: canToggle && !busy ? 'pointer' : 'default',
        }}
      >
        <Box sx={{ color: 'primary.main', display: 'flex', flexShrink: 0 }}>
          {on ? <NotificationsActive /> : <NotificationsOffOutlined />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography>Notifications</Typography>
          <Typography variant='body2' color='text.secondary'>
            On this device.
          </Typography>
        </Box>
        {state === null ? (
          <Skeleton variant='rounded' width='3.5rem' height='2rem' sx={{ borderRadius: 4, flexShrink: 0 }} />
        ) : (
          <Switch
            edge='end'
            checked={on}
            disabled={!canToggle || busy}
            onChange={handleToggle}
          />
        )}
      </Box>

      {NOTES[state] && (
        <Typography variant='body2' color='text.secondary'>
          {NOTES[state]}
        </Typography>
      )}

      {state === 'needs-install' && (
        <Button
          onClick={() => setIosOpen(true)}
          sx={[softRaisedSmall, softPressSx, { alignSelf: 'flex-start', minHeight: '3rem', px: 2.5 }]}
        >
          How to add it
        </Button>
      )}

      {on && (
        <Button
          onClick={handleTest}
          disabled={testState === 'sending' || busy}
          startIcon={
            testState === 'sent' ? (
              <CheckCircleOutline color='success' className='pop' />
            ) : (
              <SendOutlined />
            )
          }
          sx={[softRaisedSmall, softPressSx, { alignSelf: 'flex-start', minHeight: '3rem', px: 2.5 }]}
        >
          {testState === 'sent' ? 'Test sent' : 'Send a test'}
        </Button>
      )}

      {error && <Alert severity='error'>{error}</Alert>}

      {on && prefs && (
        <PushTypeSwitches prefs={prefs} reminderLeads={reminderLeads} onAnnounce={setAnnouncement} />
      )}

      <Box component='span' role='status' aria-live='polite' sx={visuallyHidden}>
        {announcement}
      </Box>

      <IosInstallDialog open={iosOpen} onClose={() => setIosOpen(false)} />
    </Box>
  );
}
