'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { DAY_FIELDS, DAY_LABELS } from '@/lib/dayFormat';
import { softInset, softPressSx, softTableSx } from '@/components/utility/soft';
import { describeJobChange } from './jobChangeText';

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

// One job from the Jobs tab: its details and its own change history.
// `jobName` is the open job (null when closed); `job` is its saved row, or
// undefined when it has left the sheet (opened from an old change).
export default function SheetJobDialog({ jobName, job, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [history, setHistory] = useState({ jobName: null, changes: [], error: '' });

  useEffect(() => {
    if (!jobName) return;
    let cancelled = false;
    fetch(`/api/sheet-jobs/changes?job=${encodeURIComponent(jobName)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Couldn't load this job's changes.");
        if (!cancelled) setHistory({ jobName, changes: data.data.changes, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setHistory({ jobName, changes: [], error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [jobName]);

  const loaded = history.jobName === jobName;
  const workDays = job ? DAY_FIELDS.filter((day) => job.days?.[day]?.start) : [];

  return (
    <Dialog
      open={Boolean(jobName)}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth='sm'
      aria-labelledby='sheet-job-title'
    >
      <DialogTitle id='sheet-job-title' sx={{ pr: 8 }}>
        {jobName}
      </DialogTitle>
      <IconButton
        onClick={onClose}
        aria-label='Close'
        sx={[softPressSx, { position: 'absolute', top: '0.75rem', right: '0.75rem' }]}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pb: 1 }}>
          {!job ? (
            <Typography variant='body2' color='text.secondary'>
              This job is no longer on the sheet.
            </Typography>
          ) : (
            <>
              <Stack spacing={1.5} sx={[softInset, { p: 2, borderRadius: 3 }]}>
                <Detail label='Driver' value={job.driver} />
                <Detail label='Seniority' value={job.seniority} />
                <Detail label='Hours for week' value={job.weekHours} />
              </Stack>

              <Box>
                <Typography variant='subtitle2' component='h3'>
                  Schedule
                </Typography>
                {workDays.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    No days scheduled.
                  </Typography>
                ) : (
                  <Table size='small' sx={softTableSx}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Day</TableCell>
                        <TableCell>Start</TableCell>
                        <TableCell>Hours</TableCell>
                        <TableCell>Miles</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workDays.map((day) => (
                        <TableRow key={day}>
                          <TableCell>{DAY_LABELS[day]}</TableCell>
                          <TableCell>{job.days[day].start}</TableCell>
                          <TableCell>{job.days[day].hours}</TableCell>
                          <TableCell>{job.days[day].miles}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>

              <Box>
                <Typography variant='subtitle2' component='h3'>
                  Description
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}
                >
                  {job.description || '—'}
                </Typography>
              </Box>
            </>
          )}

          <Box>
            <Typography variant='subtitle2' component='h3'>
              History
            </Typography>
            {!loaded ? (
              <Stack spacing={1} sx={{ mt: 1 }} aria-busy='true' aria-label='Loading history'>
                <Skeleton variant='rounded' height='1.5rem' />
                <Skeleton variant='rounded' height='1.5rem' />
              </Stack>
            ) : history.error ? (
              <Alert severity='error' sx={{ mt: 1 }}>{history.error}</Alert>
            ) : history.changes.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                No changes recorded for this job.
              </Typography>
            ) : (
              <Box component='ul' sx={{ m: 0, mt: 1, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {history.changes.map((change) => (
                  <Box component='li' key={change._id} sx={{ typography: 'body2' }}>
                    <Box component='span' sx={{ color: 'text.secondary' }}>
                      {dayjs(change.seenAt).format('MMM D, h:mm A')} ·{' '}
                    </Box>
                    {describeJobChange(change)}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
