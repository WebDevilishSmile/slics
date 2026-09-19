'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DAY_FIELDS, DAY_LABELS, DAY_COLORS, formatDayValue } from './dayFormat';

function CoverBidJobCard({ job, onSelect }) {
  const activeDays = DAY_FIELDS.filter((day) => job[day]);

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
            {job.jobNumber}
          </Typography>
          {onSelect && (
            <IconButton
              size='small'
              onClick={() => onSelect(job)}
              aria-label='View details'
            >
              <InfoOutlinedIcon fontSize='small' />
            </IconButton>
          )}
        </Box>

        {/* Day chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {activeDays.map((day) => (
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
                {formatDayValue(job[day])}
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

export default CoverBidJobCard;
