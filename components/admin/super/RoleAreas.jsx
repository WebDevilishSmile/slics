'use client';

import { useState } from 'react';
import { Alert, Box, Switch, Typography } from '@mui/material';

import { ROLE_LABELS, STAFF_AREAS, STAFF_ROLES } from '@/constants';
import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { softRaised } from '@/components/utility/soft';

const columns = `minmax(0, 1fr) repeat(${STAFF_ROLES.length}, 4.5rem)`;

// The switches for which tools each staff role may use (docs/STAFF-ROLES.md):
// a row per tool, a column per role. A tap saves at once (PATCH
// /api/role-areas, written to admin_audit), and tapping again undoes it, so
// there's no confirm. Super admins always have every tool, so they aren't a
// column. `areas` is { admin: [...keys], dispatch: [...keys] }.
export default function RoleAreas({ areas, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const toggle = async (role, area, on) => {
    setBusy(true);
    setError('');
    const { data, error: failed } = await apiRequest('/api/role-areas', {
      method: 'PATCH',
      body: { role, area: area.key, on },
    });
    setBusy(false);
    if (failed) {
      setError(failed);
      return;
    }
    onChange(data.data.areas);
    tapHaptic();
    setStatus(`${area.label} turned ${on ? 'on' : 'off'} for ${ROLE_LABELS[role]}.`);
  };

  return (
    <Box sx={(theme) => ({ ...softRaised(theme), borderRadius: 4, p: { xs: 2, sm: 2.5 } })}>
      {/* The column names; each switch also names its tool and role. */}
      <Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: columns, gap: 1, pb: 0.5 }}>
        <span />
        {STAFF_ROLES.map((role) => (
          <Typography
            key={role}
            variant='body2'
            sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'center' }}
          >
            {ROLE_LABELS[role]}
          </Typography>
        ))}
      </Box>

      <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {STAFF_AREAS.map((area) => (
          <Box
            component='li'
            key={area.key}
            sx={{
              display: 'grid',
              gridTemplateColumns: columns,
              gap: 1,
              alignItems: 'center',
              py: 1.25,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>{area.label}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {area.description}
              </Typography>
            </Box>
            {STAFF_ROLES.map((role) => (
              <Box key={role} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Switch
                  checked={areas[role].includes(area.key)}
                  disabled={busy}
                  onChange={(event) => toggle(role, area, event.target.checked)}
                  slotProps={{ input: { 'aria-label': `${area.label} for ${ROLE_LABELS[role]}` } }}
                />
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>
        Super admins always have every tool. A change reaches everyone in the role on their next
        page.
      </Typography>
      {/* Confirmed in place (CLAUDE.md, Motion): the switch moved, and this says so. */}
      <Typography
        variant='body2'
        role='status'
        aria-live='polite'
        sx={{ mt: status ? 1 : 0, color: 'primary.main', fontWeight: 600 }}
      >
        {status}
      </Typography>
      {error && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
