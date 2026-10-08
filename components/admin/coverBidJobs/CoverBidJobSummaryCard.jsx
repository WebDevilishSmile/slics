'use client';

import { Box, ButtonBase, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { DAY_FIELDS, DAY_LABELS } from '@/lib/dayFormat';
import { rowIssues } from '@/lib/coverBidJobRow';
import { softPressSx, softRaised } from '@/components/utility/soft';

// Route codes ("BETPA>VVSPA>…") have no spaces, so let lines break after
// each ">" rather than mid-code.
const withRouteBreaks = (text) =>
  text
    .split('>')
    .flatMap((part, i, parts) =>
      i < parts.length - 1 ? [`${part}>`, <wbr key={i} />] : [part]
    );

// One job on a phone or a narrow window: the whole row, read-only, at a size
// that can be read (all seven days and the full description). Tapping it opens
// the job in the review dialog, where it's edited. `status` is a short line
// at the top right (checked, unsaved changes). Inside a button, so every
// element is a span.
export default function CoverBidJobSummaryCard({ row, index, duplicate, status, onOpen }) {
  const issues = rowIssues(row, { duplicate });
  const people = [row.assignedDriver, row.coverReason, row.name].filter(Boolean);

  return (
    <ButtonBase
      onClick={() => onOpen(index)}
      sx={[
        softRaised,
        softPressSx,
        {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 1.5,
          width: 1,
          p: 2,
          borderRadius: 4,
          textAlign: 'left',
          // The day strip sizes its text to the card, not the window.
          containerType: 'inline-size',
        },
      ]}
    >
      <Box
        component='span'
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
      >
        <Typography component='span' variant='h6' sx={{ fontWeight: 700 }}>
          {row.jobNumber || 'No job #'}
        </Typography>
        {status}
      </Box>

      <Typography component='span' variant='body2'>
        {people.length > 0 ? people.join(' · ') : 'No driver or reason'}
      </Typography>

      <Box
        component='span'
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 0.75,
          textAlign: 'center',
        }}
      >
        {DAY_FIELDS.map((day) => (
          <Box component='span' key={day}>
            <Typography
              component='span'
              variant='caption'
              sx={{ display: 'block', color: 'text.secondary' }}
            >
              {DAY_LABELS[day]}
            </Typography>
            <Typography
              component='span'
              variant='caption'
              sx={(theme) => ({
                display: 'block',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: row[day] ? 600 : 400,
                color: row[day] ? 'text.primary' : 'text.secondary',
                // Seven "06:30"s fit side by side at body2 from about here.
                '@container (min-width: 26rem)': theme.typography.body2,
              })}
            >
              {row[day] || '–'}
            </Typography>
          </Box>
        ))}
      </Box>

      {row.description && (
        <Typography
          component='span'
          variant='body2'
          sx={{ color: 'text.secondary', overflowWrap: 'anywhere', whiteSpace: 'pre-line' }}
        >
          {withRouteBreaks(row.description)}
        </Typography>
      )}

      {issues.length > 0 && (
        <Box component='span' sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <WarningAmberIcon fontSize='small' sx={{ color: 'warning.main', mt: 0.25 }} />
          <Typography component='span' variant='body2'>
            {issues.map((issue) => issue.message).join('. ')}
          </Typography>
        </Box>
      )}
    </ButtonBase>
  );
}
