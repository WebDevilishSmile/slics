'use client';

import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ListToggle from './ListToggle';
import { softInset, softPressSx } from '@/components/utility/soft';
import { DAY_FIELDS, DAY_LABELS, DAY_COLORS, formatDayValue } from '@/lib/dayFormat';
import { displayName } from '@/lib/names';

function DetailRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant='body2' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='body2' sx={{ textAlign: 'right' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

// Who picked a job, and why it needs cover, are on admins' rows only. A
// driver's row (toDriverCoverJob, /covers) doesn't carry them, so the block
// is left out rather than shown empty.
const WHO_FIELDS = ['name', 'assignedDriver', 'coverReason'];

// With `list` (a verified driver on /covers), the job can go on their cover
// list from here too.
export default function CoverBidJobDetailDialog({ job, open, onClose, list = null }) {
  const scheduledDays = job ? DAY_FIELDS.filter((day) => job[day]) : [];
  const showWho = job ? WHO_FIELDS.some((field) => field in job) : false;

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {job?.jobNumber || 'Job Details'}
        <IconButton onClick={onClose} aria-label='Close' sx={softPressSx}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {job && (
          <Stack spacing={2.5} sx={{ pb: 1 }}>
            {showWho && (
              <Stack spacing={1.5} sx={[softInset, { p: 2, borderRadius: 3 }]}>
                <DetailRow label='Name' value={displayName(job.name)} />
                <DetailRow label='Assigned Driver' value={displayName(job.assignedDriver)} />
                <DetailRow label='Cover Reason' value={job.coverReason} />
              </Stack>
            )}

            <Typography variant='subtitle2'>Schedule</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {scheduledDays.length > 0 ? (
                scheduledDays.map((day) => (
                  <Chip
                    key={day}
                    label={`${DAY_LABELS[day]}: ${formatDayValue(job[day])}`}
                    color={DAY_COLORS[day] || 'default'}
                  />
                ))
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  No days scheduled.
                </Typography>
              )}
            </Box>

            <Typography variant='subtitle2'>Description</Typography>
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ whiteSpace: 'pre-line' }}
            >
              {job.description || '—'}
            </Typography>

            {list && <ListToggle job={job} list={list} variant='button' />}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
