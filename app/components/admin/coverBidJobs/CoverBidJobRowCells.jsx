'use client';

import { TableCell, TextField } from '@mui/material';
import { DAY_FIELDS, DAY_LABELS } from '@/app/components/coverBidJobs/dayFormat';
import { softInputSx } from '../../utility/soft';

// A pressed-in well per cell. The column header is the visible label, so the
// input carries it as an aria-label.
const cellField = (label) => ({
  size: 'small',
  sx: softInputSx,
  slotProps: { htmlInput: { 'aria-label': label } },
});

export function CoverBidJobRowHeadCells() {
  return (
    <>
      <TableCell>Job #</TableCell>
      <TableCell>Name</TableCell>
      <TableCell>Assigned Driver</TableCell>
      <TableCell>Cover Reason</TableCell>
      {DAY_FIELDS.map((field) => (
        <TableCell key={field}>{DAY_LABELS[field]}</TableCell>
      ))}
      <TableCell>Description</TableCell>
    </>
  );
}

export function CoverBidJobRowFields({ row, onChange }) {
  return (
    <>
      <TableCell sx={{ minWidth: '5rem' }}>
        <TextField
          {...cellField('Job #')}
          value={row.jobNumber ?? ''}
          onChange={(e) => onChange('jobNumber', e.target.value)}
        />
      </TableCell>
      <TableCell sx={{ minWidth: '7rem' }}>
        <TextField
          {...cellField('Name')}
          value={row.name ?? ''}
          onChange={(e) => onChange('name', e.target.value)}
        />
      </TableCell>
      <TableCell sx={{ minWidth: '7rem' }}>
        <TextField
          {...cellField('Assigned Driver')}
          value={row.assignedDriver ?? ''}
          onChange={(e) => onChange('assignedDriver', e.target.value)}
        />
      </TableCell>
      <TableCell sx={{ minWidth: '8rem' }}>
        <TextField
          {...cellField('Cover Reason')}
          value={row.coverReason ?? ''}
          onChange={(e) => onChange('coverReason', e.target.value)}
        />
      </TableCell>
      {DAY_FIELDS.map((field) => (
        <TableCell key={field} sx={{ minWidth: '4.5rem' }}>
          <TextField
            {...cellField(DAY_LABELS[field])}
            value={row[field] ?? ''}
            onChange={(e) => onChange(field, e.target.value)}
          />
        </TableCell>
      ))}
      <TableCell sx={{ minWidth: '16rem' }}>
        <TextField
          {...cellField('Description')}
          fullWidth
          value={row.description ?? ''}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </TableCell>
    </>
  );
}
