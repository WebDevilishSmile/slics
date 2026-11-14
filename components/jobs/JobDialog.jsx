'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import JobSchedule from '@/components/covers/JobSchedule';
import { softInset, softPressSx } from '@/components/utility/soft';
import { jobSchedule, sheetJobDays } from '@/lib/driverWeek';

function Detail({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant='body2' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='body2' sx={{ textAlign: 'right', fontWeight: 600 }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

// One job on the drivers' /jobs (jobs/JobsBoard.jsx, docs/JOBS-PAGE.md): its
// seniority number and week hours, then its week as the profile's This week
// card draws one (covers/JobSchedule.jsx), each stop that's a SLIC a link to
// its card. The schedule is worked out here from what the page already has
// (jobSchedule, lib/driverWeek.js, pure), so opening a job asks the server
// nothing. `job` is null while closed; `slicsByStop` is a Map of stopKey →
// { numSlic, alpha }. Full screen on a phone.
export default function JobDialog({ job, slicsByStop, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  // The last job opened stays drawn while the dialog closes.
  const [shown, setShown] = useState(job);
  if (job && job !== shown) setShown(job);

  const schedule = useMemo(
    () =>
      shown
        ? jobSchedule({ ...sheetJobDays(shown), description: shown.description, slicsByStop })
        : null,
    [shown, slicsByStop],
  );

  return (
    <Dialog
      open={Boolean(job)}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth='sm'
      aria-labelledby='job-dialog-title'
    >
      <DialogTitle id='job-dialog-title' sx={{ pr: 8 }}>
        {shown?.jobName}
        {shown?.mine && (
          <Typography component='span' variant='body2' sx={{ display: 'block', color: 'primary.main', fontWeight: 700 }}>
            Your job
          </Typography>
        )}
      </DialogTitle>
      <IconButton
        onClick={onClose}
        aria-label='Close'
        sx={[softPressSx, { position: 'absolute', top: '0.75rem', right: '0.75rem' }]}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent>
        {shown && (
          <Stack spacing={2.5} sx={{ pb: 1 }}>
            <Stack spacing={1.5} sx={[softInset, { p: 2, borderRadius: 3 }]}>
              <Detail label='Seniority' value={shown.seniority && `#${shown.seniority}`} />
              <Detail label='Hours for week' value={shown.weekHours} />
            </Stack>
            <Box>
              <Typography variant='subtitle2' component='h3' sx={{ mb: 1 }}>
                Schedule
              </Typography>
              <JobSchedule schedule={schedule} />
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
