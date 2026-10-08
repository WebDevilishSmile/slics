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
import { softInset, softPressSx } from '@/components/utility/soft';
import { DAY_FIELDS, DAY_LABELS, DAY_COLORS, formatDayValue } from './dayFormat';

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

export default function CoverBidJobDetailDialog({ job, open, onClose }) {
  const scheduledDays = job ? DAY_FIELDS.filter((day) => job[day]) : [];

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
            <Stack spacing={1.5} sx={[softInset, { p: 2, borderRadius: 3 }]}>
              <DetailRow label='Name' value={job.name} />
              <DetailRow label='Assigned Driver' value={job.assignedDriver} />
              <DetailRow label='Cover Reason' value={job.coverReason} />
            </Stack>

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
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
