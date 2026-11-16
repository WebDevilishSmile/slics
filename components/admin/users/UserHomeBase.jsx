'use client';

import { useState } from 'react';
import { visuallyHidden } from '@mui/utils';
import { Alert, Box, Button, Typography } from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { isDefaultHub, homeBaseLabel } from '@/lib/homeBase';
import { setHomeBaseRequestsCount } from '@/lib/homeBaseRequestsStore';
import HomeBasePicker from '@/components/homeBase/HomeBasePicker';
import { softContainedSx, softInset, softPressSx, softRaisedSmall } from '@/components/utility/soft';

// Where an answer came from (lib/homeBase.js HOME_BASE_SOURCES).
const SOURCE_TEXT = {
  sheet: 'From the on-call sheet',
  staff: 'With their staff role',
  asked: 'They answered',
  admin: 'Set by an admin',
};

const buttonSx = [softRaisedSmall, softPressSx, { px: 2, minHeight: '2.75rem' }];

// The account's home building on /admin/users/[id] (docs/MULTI-HUB.md "Home
// base", step 4), Users area: the building and where it came from, Change (the
// driver's picker, saved as `source: 'admin'` through PUT
// /api/users/[id]/home-base), and a change a verified driver or staff member
// asked for, with Approve and Decline. Approving a verified driver's move away
// from BETPA reminds the admin of their sheet link, which stays its own step
// (Driver verification below). Each is written to `admin_audit` first.
// `initial` is { homeBase, homeBaseRequest } (toHomeBase); `driverName` the
// sheet name they're linked to, or null.
export default function UserHomeBase({ userId, name = '', initial, driverName = null }) {
  const [homeBase, setHomeBase] = useState(initial.homeBase);
  const [request, setRequest] = useState(initial.homeBaseRequest);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [linkReminder, setLinkReminder] = useState(false);

  const apply = (saved, message) => {
    // A request settled here no longer counts on the badge; the next fetch
    // has the exact number.
    if (request && !saved.homeBaseRequest) setHomeBaseRequestsCount((count) => Math.max(0, count - 1));
    setHomeBase(saved.homeBase ?? null);
    setRequest(saved.homeBaseRequest ?? null);
    setAnnouncement(message);
    tapHaptic();
  };

  const decide = async (approve) => {
    const asked = request;
    setBusy(true);
    setError('');
    const { data, error: saveError } = await apiRequest(`/api/users/${userId}/home-base-request`, {
      method: 'POST',
      body: { approve },
    });
    setBusy(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    apply(data, approve ? `Approved: ${homeBaseLabel(asked)}` : 'Request declined');
    setLinkReminder(approve && Boolean(driverName) && !isDefaultHub(asked.numSlic, asked.alphaSlic));
  };

  return (
    <Box
      sx={[
        softInset,
        { alignSelf: 'stretch', borderRadius: 4, p: 2, mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 },
      ]}
    >
      <Typography variant='subtitle2' component='h2'>
        Home building
      </Typography>
      <Box>
        <Typography sx={{ fontWeight: 600 }}>{homeBase ? homeBaseLabel(homeBase) : 'Not answered'}</Typography>
        {homeBase && (
          <Typography variant='body2' color='text.secondary'>
            {SOURCE_TEXT[homeBase.source] ?? 'Set'}
            {homeBase.listed === false && ' · not on the All Hubs list yet'}
          </Typography>
        )}
      </Box>

      {request && (
        <Box sx={[softRaisedSmall, { borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }]}>
          <Typography variant='body2'>
            {name || 'They'} asked to change it to <strong>{homeBaseLabel(request)}</strong>
            {request.listed === false && ' (not on the All Hubs list)'}.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button
              variant='contained'
              onClick={() => decide(true)}
              disabled={busy}
              sx={[softContainedSx, { px: 2.5, minHeight: '2.75rem' }]}
            >
              Approve
            </Button>
            <Button onClick={() => decide(false)} disabled={busy} sx={buttonSx}>
              Decline
            </Button>
          </Box>
        </Box>
      )}

      {linkReminder && (
        <Alert severity='info' onClose={() => setLinkReminder(false)}>
          They&apos;re still linked to BETPA&apos;s on-call sheet as {driverName}. If they&apos;ve left,
          remove the link under Driver verification.
        </Alert>
      )}

      <Button onClick={() => setPickerOpen(true)} aria-haspopup='dialog' sx={[...buttonSx, { alignSelf: 'flex-start' }]}>
        {homeBase ? 'Change' : 'Set building'}
      </Button>
      {error && <Alert severity='error'>{error}</Alert>}
      <Box component='span' role='status' aria-live='polite' sx={visuallyHidden}>
        {announcement}
      </Box>

      <HomeBasePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSaved={(saved) => {
          setPickerOpen(false);
          apply(saved, `Home building saved: ${homeBaseLabel(saved.homeBase)}`);
        }}
        endpoint={`/api/users/${userId}/home-base`}
        title={`Which building does ${name || 'this driver'} work out of?`}
        description={request ? 'Saving this settles their request too.' : null}
      />
    </Box>
  );
}
