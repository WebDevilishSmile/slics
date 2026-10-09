'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SyncIcon from '@mui/icons-material/Sync';

import { tapHaptic } from '@/lib/haptics';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

function summary({ jobs, baseline, changes, added, removed, changedJobs }) {
  const time = dayjs().format('h:mm A');
  if (baseline) return `Saved ${jobs} jobs at ${time}. Changes are recorded from now on.`;
  if (changes === 0) return `Checked at ${time}: no changes.`;
  const parts = [];
  if (changedJobs) parts.push(`${changedJobs} job${changedJobs === 1 ? '' : 's'} changed`);
  if (added) parts.push(`${added} added`);
  if (removed) parts.push(`${removed} removed`);
  return `Updated at ${time}: ${parts.join(', ')}`;
}

// Pulls the sheet's Jobs tab (POST /api/sheet-jobs/refresh) and re-renders the
// server page with what was saved. `lastSyncedAt` (ISO or null) is when the
// tab was last read, by this button or (stage 3) the sheet's ping.
export default function JobsRefreshButton({ lastSyncedAt }) {
  const lastSynced = lastSyncedAt
    ? `Last checked ${dayjs(lastSyncedAt).format('MMM D, h:mm A')}`
    : 'Not pulled from the sheet yet.';
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    setBusy(true);
    setError('');
    setDone('');
    try {
      const res = await fetch('/api/sheet-jobs/refresh', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't refresh the jobs.");
      setDone(summary(data.data));
      tapHaptic();
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
        }}
      >
        <Button
          onClick={refresh}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} color='inherit' /> : <SyncIcon />}
          sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
        >
          {busy ? 'Reading the sheet…' : 'Refresh jobs from sheet'}
        </Button>
        <Box
          role='status'
          aria-live='polite'
          sx={{ display: 'flex', alignItems: 'center', gap: 0.75, typography: 'body2', color: 'text.secondary' }}
        >
          {done ? (
            <>
              <CheckCircleOutlineIcon fontSize='small' color='success' className='pop' />
              {done}
            </>
          ) : (
            lastSynced
          )}
        </Box>
      </Box>
      {error && <Alert severity='error'>{error}</Alert>}
    </Box>
  );
}
