'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SyncIcon from '@mui/icons-material/Sync';

import { tapHaptic } from '@/lib/haptics';
import {
  softContainedSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

function summary({ jobs, jobsChanged, picks, pickChanges, firstRefresh }) {
  const time = dayjs().format('h:mm A');
  if (firstRefresh) {
    return `Saved at ${time}: ${jobs} jobs and ${picks} pick rows`;
  }
  const pickText = `${pickChanges} pick change${pickChanges === 1 ? '' : 's'}`;
  return `Updated at ${time}: ${jobsChanged ? `${jobs} jobs saved` : 'jobs unchanged'} · ${pickText}`;
}

// Pulls the selected week from the on-call sheet and saves it
// (POST /api/cover-bid-jobs/refresh, docs/ON-CALL-SHEET-SYNC.md). Replaces the
// photo upload. Key it by week so a new week starts with a clean message.
export default function SheetRefreshButton({ weekEndDate, onRefreshed }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  // The server's question when the week has uploaded jobs, or ''.
  const [confirm, setConfirm] = useState('');

  const weekEnding = weekEndDate.format('YYYY-MM-DD');
  const weekLabel = weekEndDate.format('M/D/YYYY');

  async function refresh(replaceUploaded = false) {
    setBusy(true);
    setError('');
    setDone('');
    try {
      const res = await fetch('/api/cover-bid-jobs/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekEnding, replaceUploaded }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setConfirm(data.error);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Couldn't refresh the week.");
      setConfirm('');
      setDone(summary(data.data));
      tapHaptic();
      onRefreshed?.(weekEnding);
    } catch (err) {
      setConfirm('');
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
        }}
      >
        <Button
          onClick={() => refresh()}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} color='inherit' /> : <SyncIcon />}
          sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
        >
          {busy ? 'Reading the sheet…' : `Refresh W/E ${weekLabel} from sheet`}
        </Button>
        <Box
          role='status'
          aria-live='polite'
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            typography: 'body2',
            color: 'text.secondary',
          }}
        >
          {done && (
            <>
              <CheckCircleOutlineIcon fontSize='small' color='success' className='pop' />
              {done}
            </>
          )}
        </Box>
      </Box>

      {error && <Alert severity='error'>{error}</Alert>}

      <Dialog
        open={Boolean(confirm)}
        onClose={busy ? undefined : () => setConfirm('')}
        aria-labelledby='replace-uploaded-title'
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle id='replace-uploaded-title'>Replace uploaded jobs?</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirm}</DialogContentText>
        </DialogContent>
        <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setConfirm('')}
            disabled={busy}
            sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={() => refresh(true)}
            disabled={busy}
            sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
            startIcon={busy ? <CircularProgress size={16} color='inherit' /> : null}
          >
            {busy ? 'Replacing…' : 'Replace'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
