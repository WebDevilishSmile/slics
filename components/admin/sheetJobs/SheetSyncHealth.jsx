'use client';

import dayjs from 'dayjs';
import { Alert, Box, Typography } from '@mui/material';

import { formatWeekEnding } from '@/lib/onCallSheet';

// The script is considered off after this long without a ping. The sheet is
// edited most days, so a quiet weekend alone won't trip it.
const SILENT_AFTER_MS = 2 * 24 * 60 * 60 * 1000;

const when = (iso) => dayjs(iso).format('MMM D, h:mm A');

function targetName(target) {
  if (target === 'jobs') return 'the Jobs tab';
  return `W/E ${formatWeekEnding(target.slice('week:'.length))}`;
}

// Whether the sheet's notifier and the automatic reads are working
// (docs/ON-CALL-SHEET-SYNC.md, stage 3): when the sheet last pinged, any part
// whose last read failed, and a warning when the pings stop. Renders inside
// HydrationGuard, so times are local and Date.now() is the browser's.
export default function SheetSyncHealth({ lastPingAt, errors }) {
  const silent = !lastPingAt || Date.now() - new Date(lastPingAt).getTime() > SILENT_AFTER_MS;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant='body2' sx={{ color: 'text.secondary' }}>
        {lastPingAt ? `Sheet notifier: last ping ${when(lastPingAt)}` : 'Sheet notifier: no ping yet.'}
      </Typography>
      {silent && (
        <Alert severity='warning'>
          {lastPingAt
            ? `No ping from the sheet since ${when(lastPingAt)}. Your sheet script may be off: check its Triggers page at script.google.com.`
            : 'The sheet has never pinged the app. Install the script (docs/on-call-sheet-apps-script.md) and run testPing.'}{' '}
          The daily check and the Refresh button still work.
        </Alert>
      )}
      {errors.map((error) => (
        <Alert key={error.target} severity='error'>
          The last read of {targetName(error.target)} failed ({when(error.at)}): {error.message}
        </Alert>
      ))}
    </Box>
  );
}
