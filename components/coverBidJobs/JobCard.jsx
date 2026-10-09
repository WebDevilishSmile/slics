'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { softRaised } from '@/components/utility/soft';
import { DAY_COLORS, DAY_LABELS, formatDayValue } from '@/lib/dayFormat';
import { PickedLabel, pickedSx } from './jobGrid';

// The phone card for one bid job, shared by /bids (bids/BidsJobCard.jsx) and
// /cover-bid-jobs (coverBidJobs/CoverBidJobCard.jsx); each maps its own job
// shape into these props (UI-SUGGESTIONS.md #28).
// - `days`: the job's working days in display order, `[{ day: 'mon', value }]`
//   with `value` as stored (formatted here with formatDayValue).
// - `action`: optional element at the top right (a chip, a details button).
// - `picked`: a cover job someone has picked, grayed out with a "Picked"
//   label; its action still works.
// A soft raised card (CLAUDE.md "Visual style"); the day chips keep their
// colors, which tell the days apart.
function JobCard({ title, action, days, description, picked = false }) {
  return (
    <Box
      sx={[softRaised, { width: '100%', borderRadius: 3, p: 2, pb: 1 }, picked && pickedSx]}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 1.5,
        }}
      >
        <Box>
          <Typography variant='h6' fontWeight={700} lineHeight={1.2}>
            {title}
          </Typography>
          {picked && <PickedLabel sx={{ mt: 0.5 }} />}
        </Box>
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
            <Typography variant='caption' color='text.secondary'>
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
              variant='caption'
              component='p'
              color='text.secondary'
              sx={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}
            >
              {description}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}

export default JobCard;
