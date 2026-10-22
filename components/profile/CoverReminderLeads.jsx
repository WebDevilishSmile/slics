'use client';

import { useState } from 'react';
import { Alert, Box, Chip, Typography } from '@mui/material';

import { COVER_REMINDER_LEADS } from '@/constants';
import { apiRequest } from '@/lib/apiRequest';
import { leadLabel } from '@/lib/bidDay';
import { tapHaptic } from '@/lib/haptics';
import { softToggleSx } from '@/components/utility/soft';

const LEADS_URL = '/api/users/me/cover-reminders';

// How long before their call-in time a verified driver is reminded on bid
// day (docs/PUSH-NOTIFICATIONS.md, stage 3): one chip per choice in
// COVER_REMINDER_LEADS, under the "Call-in reminder" switch on /profile. Any
// number of them; each tap saves at once and goes back with an Alert if the
// save fails. The last one stays: turning the switch off is the way to have
// none. `onAnnounce` speaks the change in the parent's live region.
export default function CoverReminderLeads({ initialLeads, onAnnounce }) {
  const [leads, setLeads] = useState(initialLeads);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const toggle = async (lead) => {
    const on = !leads.includes(lead);
    if (!on && leads.length === 1) {
      onAnnounce?.('Keep at least one, or turn the reminder off.');
      return;
    }
    const previous = leads;
    const next = COVER_REMINDER_LEADS.filter((value) => (value === lead ? on : leads.includes(value)));
    setError(null);
    setLeads(next);
    setSaving(true);
    const { data, error: saveError } = await apiRequest(LEADS_URL, {
      method: 'PUT',
      body: { leads: next },
    });
    setSaving(false);
    if (saveError) {
      setLeads(previous);
      setError(saveError);
      return;
    }
    setLeads(data?.data ?? next);
    onAnnounce?.(`${leadLabel(lead)} before ${on ? 'on' : 'off'}`);
    tapHaptic();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 1 }}>
      <Typography id='reminder-leads-label' variant='body2' color='text.secondary'>
        Remind me before my call-in:
      </Typography>
      <Box role='group' aria-labelledby='reminder-leads-label' sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {COVER_REMINDER_LEADS.map((lead) => (
          <Chip
            key={lead}
            label={leadLabel(lead)}
            clickable
            disabled={saving}
            aria-pressed={leads.includes(lead)}
            onClick={() => toggle(lead)}
            sx={[softToggleSx, { minHeight: '2.75rem', minWidth: '4.5rem', borderRadius: 999 }]}
          />
        ))}
      </Box>
      {error && <Alert severity='error'>{error}</Alert>}
    </Box>
  );
}
