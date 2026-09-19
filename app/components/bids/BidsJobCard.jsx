'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const DAY_COLORS = {
  sun: 'warning',
  mon: 'primary',
  tue: 'secondary',
  wed: 'success',
  thu: 'info',
  fri: 'error',
  sat: 'warning',
};

const DAY_LABELS = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

function formatTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function BidsJobCard({ job }) {
  const activeDays = Object.entries(job.schedule || {}).filter(
    ([, time]) => time !== null
  );

  return (
    <Card sx={{ width: '100%' }}>
      <CardContent sx={{ pb: '8px !important' }}>
        {/* Header row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1.5,
          }}
        >
          <Typography variant='h6' fontWeight={700} lineHeight={1.2}>
            {job.job_name}
          </Typography>
          {job.bid_destination && (
            <Chip
              label={job.bid_destination}
              color='primary'
              variant='outlined'
              sx={{ ml: 1, fontWeight: 600, flexShrink: 0 }}
            />
          )}
        </Box>

        {/* Schedule chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {activeDays.map(([day, time]) => (
            <Box
              key={day}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.25,
              }}
            >
              <Chip
                label={DAY_LABELS[day]}
                color={DAY_COLORS[day] || 'default'}
                sx={{ fontWeight: 700, minWidth: 48 }}
              />
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ fontSize: '0.65rem' }}
              >
                {formatTime(time)}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Expandable description */}
        {job.description && (
          <Accordion
            disableGutters
            elevation={0}
            sx={{
              mt: 1,
              '&:before': { display: 'none' },
              bgcolor: 'transparent',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon fontSize='small' />}
              sx={{ px: 0, minHeight: 32, '& .MuiAccordionSummary-content': { my: 0 } }}
            >
              <Typography variant='caption' color='primary' fontWeight={600}>
                Show route
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pt: 0 }}>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontSize: '0.78rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}
              >
                {job.description}
              </Typography>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

export default BidsJobCard;
