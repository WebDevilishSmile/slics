'use client';

import { memo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { DAY_FIELDS, DAY_LABELS } from '@/lib/dayFormat';
import { isDuplicateJobNumber, rowIssues } from '@/lib/coverBidJobRow';
import { softInputSx, softTableSx } from '@/components/utility/soft';
import DayTimeField from './DayTimeField';

// Shown to screen readers only, the usual clip pattern (as in
// admin/slics/SlicsTableHeader.jsx); the sizes are strings because a bare 1
// in sx means 100%.
const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
  padding: 0,
  margin: '-1px',
};

// Each job is its own <tbody> of two rows: the sheet's columns in order, then
// the description under them across the table's width, so it shows whole.
// The pair washes together on hover, with rounded corners, and space
// between pairs tells the jobs apart.
const tableSx = (theme) => {
  const corner = theme.spacing(2);
  const firstRow = '& .MuiTableBody-root .MuiTableRow-root:first-of-type';
  const lastRow = '& .MuiTableBody-root .MuiTableRow-root:last-of-type';
  return {
    '& .MuiTableCell-root': { px: 0.5, verticalAlign: 'top' },
    '& .MuiTableCell-head': { px: 1 },
    '& .MuiTableBody-root .MuiTableRow-root:hover': { backgroundColor: 'transparent' },
    '& .MuiTableBody-root:hover .MuiTableCell-root': {
      backgroundColor: theme.vars.palette.action.hover,
    },
    [`${firstRow} .MuiTableCell-root`]: { pt: 1.5, pb: 0.5 },
    [`${lastRow} .MuiTableCell-root`]: { pt: 0.5, pb: 2 },
    [`${firstRow} .MuiTableCell-root:first-of-type`]: { borderTopLeftRadius: corner },
    [`${firstRow} .MuiTableCell-root:last-of-type`]: { borderTopRightRadius: corner },
    [`${lastRow} .MuiTableCell-root:first-of-type`]: { borderBottomLeftRadius: corner },
    [`${lastRow} .MuiTableCell-root:last-of-type`]: { borderBottomRightRadius: corner },
  };
};

// A little less padding inside the wells than a form's, to fit the row.
const cellInputSx = {
  '& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root': { px: 1.25 },
};

// Short text that wraps inside its cell instead of being cut off. Enter
// doesn't start a new line in these one-line values (`singleLine`).
function WrapField({ label, value, onChange, singleLine = false, ...props }) {
  return (
    <TextField
      multiline
      size='small'
      fullWidth
      value={value ?? ''}
      onChange={(event) =>
        onChange(
          singleLine
            ? event.target.value.replace(/\s*\n\s*/g, ' ')
            : event.target.value
        )
      }
      onKeyDown={(event) => {
        if (singleLine && event.key === 'Enter') event.preventDefault();
      }}
      slotProps={{ htmlInput: { 'aria-label': label } }}
      sx={[softInputSx, cellInputSx]}
      {...props}
    />
  );
}

// The day cells' column header is the label people see; the field keeps its
// own label for screen readers. The time fills its cell, and its hidden
// "hh:mm" placeholder doesn't get to widen the column.
const dayCellSx = [
  cellInputSx,
  {
    '& .MuiInputLabel-root': visuallyHidden,
    '& .MuiPickersInputBase-sectionsContainer': { width: 0 },
  },
];

const JobRows = memo(function JobRows({
  row,
  index,
  duplicate,
  onFieldChange,
  renderLeading,
  renderActions,
}) {
  const change = (field) => (value) => onFieldChange(row.key, field, value);
  const issues = rowIssues(row, { duplicate });
  const descriptionId = `${row.key}-description`;

  return (
    <TableBody>
      <TableRow>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{renderLeading(row, index)}</TableCell>
        <TableCell>
          <WrapField
            label='Job #'
            value={row.jobNumber}
            onChange={change('jobNumber')}
            error={duplicate}
            singleLine
          />
        </TableCell>
        <TableCell>
          <WrapField label='Name' value={row.name} onChange={change('name')} singleLine />
        </TableCell>
        <TableCell>
          <WrapField
            label='Assigned Driver'
            value={row.assignedDriver}
            onChange={change('assignedDriver')}
            singleLine
          />
        </TableCell>
        <TableCell>
          <WrapField
            label='Cover Reason'
            value={row.coverReason}
            onChange={change('coverReason')}
            singleLine
          />
        </TableCell>
        {DAY_FIELDS.map((day) => (
          <TableCell key={day}>
            <DayTimeField
              label={DAY_LABELS[day]}
              size='small'
              value={row[day] ?? ''}
              onChange={change(day)}
              fullWidth
              sx={dayCellSx}
            />
          </TableCell>
        ))}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{renderActions(row, index)}</TableCell>
      </TableRow>

      <TableRow>
        <TableCell />
        <TableCell>
          <Typography
            component='label'
            htmlFor={descriptionId}
            variant='caption'
            sx={{ display: 'block', pt: 1, color: 'text.secondary' }}
          >
            Description
          </Typography>
        </TableCell>
        <TableCell colSpan={3 + DAY_FIELDS.length}>
          <WrapField
            id={descriptionId}
            label='Description'
            value={row.description}
            onChange={change('description')}
          />
          {issues.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1 }}>
              <WarningAmberIcon fontSize='small' sx={{ color: 'warning.main', mt: 0.25 }} />
              <Typography variant='body2'>
                {issues.map((issue) => issue.message).join('. ')}
              </Typography>
            </Box>
          )}
        </TableCell>
        <TableCell />
      </TableRow>
    </TableBody>
  );
});

// The week's jobs on a wide screen, every field editable in place. Shared by
// the upload drafts and the saved week, which differ only in the first column
// (`renderLeading`: checked box and review button, or just review) and the
// last (`renderActions`). Those two, and `onFieldChange`, must be stable
// (useCallback): each job's rows only re-render when that job changes.
export default function CoverBidJobsTable({
  rows,
  duplicates,
  onFieldChange,
  renderLeading,
  renderActions,
  leadingLabel,
}) {
  return (
    <TableContainer>
      <Table size='small' sx={[softTableSx, tableSx]}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '1%' }}>
              <Box component='span' sx={visuallyHidden}>
                {leadingLabel}
              </Box>
            </TableCell>
            <TableCell sx={{ minWidth: '4rem' }}>Job #</TableCell>
            <TableCell sx={{ minWidth: '4.5rem' }}>Name</TableCell>
            <TableCell sx={{ minWidth: '6.25rem' }}>Assigned Driver</TableCell>
            <TableCell sx={{ minWidth: '6.5rem' }}>Cover Reason</TableCell>
            {DAY_FIELDS.map((day) => (
              <TableCell key={day} sx={{ minWidth: '5rem' }}>
                {DAY_LABELS[day]}
              </TableCell>
            ))}
            <TableCell sx={{ width: '1%' }}>
              <Box component='span' sx={visuallyHidden}>
                Actions
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        {rows.map((row, index) => (
          <JobRows
            key={row.key}
            row={row}
            index={index}
            duplicate={isDuplicateJobNumber(row, duplicates)}
            onFieldChange={onFieldChange}
            renderLeading={renderLeading}
            renderActions={renderActions}
          />
        ))}
      </Table>
    </TableContainer>
  );
}
