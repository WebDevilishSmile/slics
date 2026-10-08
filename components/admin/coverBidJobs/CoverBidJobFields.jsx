'use client';

import { Alert, Box, TextField, Typography } from '@mui/material';
import { DAY_FIELDS, DAY_LABELS } from '@/lib/dayFormat';
import { rowIssues } from '@/lib/coverBidJobRow';
import { softInputSx } from '@/components/utility/soft';
import DayTimeField from './DayTimeField';

// One job's fields at full size, for the review dialog: labeled, in the
// sheet's column order, with the whole description showing. What's worth a
// second look (a repeated job number, a day that isn't a time, a row with no
// times) is flagged on its field, never blocking.
export default function CoverBidJobFields({ row, onChange, duplicate = false }) {
  const issues = rowIssues(row, { duplicate });
  const issueFor = (field) =>
    issues.find((issue) => issue.field === field)?.message;
  const rowIssue = issueFor(null);

  const textField = (field, label, gridColumn, props) => (
    <TextField
      label={label}
      value={row[field] ?? ''}
      onChange={(event) => onChange(field, event.target.value)}
      fullWidth
      sx={[softInputSx, { gridColumn }]}
      {...props}
    />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {rowIssue && (
        <Alert severity='warning'>
          {rowIssue}. If this line on the sheet is a heading or a spacer,
          delete it.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: 2,
        }}
      >
        {textField('jobNumber', 'Job #', 'span 2', {
          error: duplicate,
          helperText: issueFor('jobNumber'),
        })}
        {textField('name', 'Name', 'span 4')}
        {textField('assignedDriver', 'Assigned Driver', {
          xs: 'span 6',
          sm: 'span 3',
        })}
        {textField('coverReason', 'Cover Reason', { xs: 'span 6', sm: 'span 3' })}
      </Box>

      <Box component='fieldset' sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
        <Typography
          component='legend'
          variant='body2'
          sx={{ fontWeight: 500, p: 0, mb: 1 }}
        >
          Times{' '}
          <Box component='span' sx={{ color: 'text.secondary', fontWeight: 400 }}>
            (24-hour, as printed)
          </Box>
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(6.5rem, 1fr))',
            gap: 1.5,
          }}
        >
          {DAY_FIELDS.map((day) => (
            <DayTimeField
              key={day}
              label={DAY_LABELS[day]}
              value={row[day] ?? ''}
              onChange={(value) => onChange(day, value)}
              clearable
              fullWidth
            />
          ))}
        </Box>
      </Box>

      {textField('description', 'Description', undefined, {
        multiline: true,
        minRows: 3,
      })}
    </Box>
  );
}
