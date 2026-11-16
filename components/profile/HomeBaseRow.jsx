'use client';

import { useState } from 'react';
import { WarehouseOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

import { homeBaseIsFixed, homeBaseLabel } from '@/lib/homeBase';
import HomeBasePicker from '@/components/homeBase/HomeBasePicker';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

const note = (text) => (
  <Typography component='span' variant='body2' color='text.secondary' sx={{ display: 'block' }}>
    {text}
  </Typography>
);

const buttonSx = [softRaisedSmall, softPressSx, { px: 1.5, minHeight: '2.5rem' }];

// "Home building" in the profile's Account well (docs/MULTI-HUB.md "Home
// base"). A driver changes it with the picker. A verified driver's follows
// the on-call sheet and staff's their role (homeBaseIsFixed), so they ask an
// admin instead: the pick waits as a request, shown with Cancel, until it's
// approved or declined on /admin/users/[id]. `Detail` is the well's row
// layout, `userData` toSelfUser (`homeBase`, `homeBaseRequest`,
// `driverVerified`, `role`). Changes show in place with a polite live region.
export default function HomeBaseRow({ Detail, userData }) {
  const [homeBase, setHomeBase] = useState(userData.homeBase ?? null);
  const [request, setRequest] = useState(userData.homeBaseRequest ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fixed = homeBaseIsFixed(userData);

  const onSaved = (saved) => {
    setPickerOpen(false);
    if (saved.request) {
      setRequest(saved.request);
      setAnnouncement(`Asked an admin to change your building to ${homeBaseLabel(saved.request)}`);
    } else if (saved.homeBase) {
      setHomeBase(saved.homeBase);
      setAnnouncement(`Home building saved: ${homeBaseLabel(saved.homeBase)}`);
    }
  };

  const cancelRequest = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/users/me/home-base-request', { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't cancel your request. Please try again.");
      setRequest(null);
      setAnnouncement('Request cancelled');
    } catch (cancelError) {
      setError(cancelError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Detail icon={<WarehouseOutlined />} label='Home building'>
        {homeBase ? homeBaseLabel(homeBase) : 'Not set'}
        {homeBase?.listed === false && note('Waiting to be checked')}
        {fixed && homeBase && note(userData.driverVerified ? 'Set from the on-call sheet' : 'Set with your staff role')}
        {request && note(`You asked for ${homeBaseLabel(request)}. Waiting for an admin.`)}
      </Detail>
      <Box component='span' role='status' aria-live='polite' sx={visuallyHidden}>
        {announcement}
      </Box>
      <Box sx={{ pl: 4.5, mt: -1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
        {request ? (
          <Button size='small' onClick={cancelRequest} disabled={busy} sx={buttonSx}>
            {busy ? 'Cancelling…' : 'Cancel request'}
          </Button>
        ) : (
          <Button size='small' onClick={() => setPickerOpen(true)} aria-haspopup='dialog' sx={buttonSx}>
            {fixed ? 'Ask to change' : homeBase ? 'Change' : 'Set your building'}
          </Button>
        )}
        {error && <Alert severity='error'>{error}</Alert>}
      </Box>

      <HomeBasePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSaved={onSaved}
        {...(fixed
          ? {
              description: 'An admin checks the change, since your building comes from the on-call sheet.',
              saveLabel: 'Ask an admin',
            }
          : {})}
      />
    </>
  );
}
