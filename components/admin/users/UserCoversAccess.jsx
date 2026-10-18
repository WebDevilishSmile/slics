'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { visuallyHidden } from '@mui/utils';
import { Alert, Box, Switch, Typography } from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { softInset } from '@/components/utility/soft';

// Covers early access for one account (docs/COVER-BIDDING.md), on the
// /admin/users card and the user's page: the super admin lets them into Covers
// before it opens to every driver (canUseCovers, lib/authz.js). It only adds,
// so staff whose role has the Covers tool (`byRole`) already have it and get
// no switch. `initial` is toCoversAccess (lib/serializers.js), `canChange` the
// super admin, `onSaved` gets the saved value. `framed`: in its own well with
// a heading, beside Driver verification on the user's page.
export default function UserCoversAccess({
  userId,
  name = '',
  initial = null,
  byRole = false,
  coversOpen = false,
  canChange = false,
  framed = false,
  onSaved,
}) {
  const [access, setAccess] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const save = async (on) => {
    const before = access;
    setError('');
    // Flipped at once, put back if the save fails (profile/PushTypeSwitches.jsx).
    setAccess(on ? { at: new Date().toISOString(), by: null } : null);
    setBusy(true);
    const { data, error: saveError } = await apiRequest(`/api/users/${userId}/covers-access`, {
      method: 'PUT',
      body: { on },
    });
    setBusy(false);
    if (saveError) {
      setAccess(before);
      setError(saveError);
      return;
    }
    const saved = data.data.coversAccess;
    setAccess(saved);
    setAnnouncement(`Covers early access ${saved ? 'on' : 'off'} for ${name || 'this account'}.`);
    tapHaptic();
    onSaved?.(saved);
  };

  const status = byRole
    ? 'Has Covers through their role.'
    : access
      ? `On since ${dayjs(access.at).format('MMM D, YYYY')}${access.by ? `, by ${access.by}` : ''}.`
      : 'Off: they get Covers when it opens to every driver.';
  const showSwitch = canChange && !byRole;

  const text = (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant={framed ? 'body1' : 'subtitle1'} sx={framed ? { fontWeight: 600 } : undefined}>
        {framed ? 'Early access' : 'Covers early access'}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {status}
      </Typography>
      {coversOpen && !byRole && (
        <Typography variant='body2' color='text.secondary'>
          Covers is open to every driver now, so this only matters if it closes again.
        </Typography>
      )}
    </Box>
  );

  const row = showSwitch ? (
    <Box
      component='label'
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minHeight: '3rem', cursor: busy ? 'default' : 'pointer' }}
    >
      {text}
      <Switch
        edge='end'
        checked={Boolean(access)}
        disabled={busy}
        onChange={(event) => save(event.target.checked)}
      />
    </Box>
  ) : (
    <Box sx={{ display: 'flex', alignItems: 'center', minHeight: '3rem' }}>{text}</Box>
  );

  const body = (
    <>
      {row}
      {error && <Alert severity='error'>{error}</Alert>}
      <Box component='span' role='status' aria-live='polite' sx={visuallyHidden}>
        {announcement}
      </Box>
    </>
  );

  if (!framed) {
    return <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 1 }}>{body}</Box>;
  }
  return (
    <Box
      sx={[
        softInset,
        { alignSelf: 'stretch', borderRadius: 4, p: 2, mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 },
      ]}
    >
      <Typography variant='subtitle2' component='h2'>
        Covers
      </Typography>
      {body}
    </Box>
  );
}
