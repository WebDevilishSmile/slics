'use client';

import { useState } from 'react';
import { Alert, Box, Switch, Typography } from '@mui/material';

import { PUSH_TYPES } from '@/constants';
import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';

const PREFS_URL = '/api/users/me/push-prefs';

// The kinds of notification an admin gets (docs/PUSH-NOTIFICATIONS.md, stage
// 1b), under the device switch on /profile once this device is on. Per
// account, so they apply to every device the admin turned on. Each switch
// saves on its own: flipped at once, put back with an Alert if the save fails.
// `prefs` is `{ key: boolean }` for the kinds this account may choose (a
// super admin also sees Buy Me a Coffee). `onAnnounce` speaks the change in
// the parent's live region.
export default function PushTypeSwitches({ prefs: initialPrefs, onAnnounce }) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [pending, setPending] = useState(() => new Set());
  const [error, setError] = useState(null);

  const types = PUSH_TYPES.filter((type) => Object.hasOwn(prefs, type.key));
  const groups = [];
  for (const type of types) {
    const last = groups.at(-1);
    if (last?.name === type.group) last.types.push(type);
    else groups.push({ name: type.group, types: [type] });
  }

  const setPendingKey = (key, isPending) =>
    setPending((keys) => {
      const next = new Set(keys);
      if (isPending) next.add(key);
      else next.delete(key);
      return next;
    });

  const toggle = async (type) => {
    const on = !prefs[type.key];
    setError(null);
    setPrefs((current) => ({ ...current, [type.key]: on }));
    setPendingKey(type.key, true);
    const { data, error: saveError } = await apiRequest(PREFS_URL, {
      method: 'PATCH',
      body: { key: type.key, on },
    });
    setPendingKey(type.key, false);
    if (saveError) {
      setPrefs((current) => ({ ...current, [type.key]: !on }));
      setError(saveError);
      return;
    }
    // Only this key from the answer: another switch may be mid-save.
    setPrefs((current) => ({ ...current, [type.key]: data?.data?.[type.key] ?? on }));
    onAnnounce?.(`${type.label} ${on ? 'on' : 'off'}`);
    tapHaptic();
  };

  return (
    <Box
      component='section'
      aria-labelledby='push-types-heading'
      sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}
    >
      <Box>
        <Typography id='push-types-heading' sx={{ fontWeight: 600 }}>
          Send me
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          These apply to every device you&apos;ve turned on.
        </Typography>
      </Box>

      {groups.map((group) => (
        <Box key={group.name} role='group' aria-label={group.name}>
          <Typography variant='overline' color='text.secondary' component='p' sx={{ lineHeight: 2 }}>
            {group.name}
          </Typography>
          {group.types.map((type) => (
            <Box
              key={type.key}
              component='label'
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                minHeight: '3rem',
                py: 0.5,
                cursor: pending.has(type.key) ? 'default' : 'pointer',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography>{type.label}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {type.description}
                </Typography>
              </Box>
              <Switch
                edge='end'
                checked={Boolean(prefs[type.key])}
                disabled={pending.has(type.key)}
                onChange={() => toggle(type)}
              />
            </Box>
          ))}
        </Box>
      ))}

      {error && <Alert severity='error'>{error}</Alert>}
    </Box>
  );
}
