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
import { DAY_COLORS, DAY_LABELS, formatDayValue } from './dayFormat';

// The phone card for one bid job, shared by /bids (bids/BidsJobCard.jsx) and
// /cover-bid-jobs (coverBidJobs/CoverBidJobCard.jsx); each maps its own job
// shape into these props (UI-SUGGESTIONS.md #28).
// - `days`: the job's working days in display order, `[{ day: 'mon', value }]`
//   with `value` as stored (formatted here with formatDayValue).
// - `action`: optional element at the top right (a chip, a details button).
function JobCard({ title, action, days, description }) {
  return (
    <Card sx={{ width: '100%' }}>
      <CardContent sx={{ '&:last-child': { pb: 1 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1.5,
          }}
        >
          <Typography variant='h6' fontWeight={700} lineHeight={1.2}>
            {title}
          </Typography>
          {action}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {days.map(({ day, value }) => (
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
                {formatDayValue(value)}
              </Typography>
            </Box>
          ))}
        </Box>

        {description && (
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
              sx={{
                px: 0,
                minHeight: 32,
                '& .MuiAccordionSummary-content': { my: 0 },
              }}
            >
              <Typography variant='caption' color='primary' fontWeight={600}>
                Show route
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pt: 0 }}>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{
                  fontSize: '0.78rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {description}
              </Typography>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

export default JobCard;
