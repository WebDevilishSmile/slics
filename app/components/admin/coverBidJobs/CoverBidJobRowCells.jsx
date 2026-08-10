'use client';

import { TableCell, TextField } from '@mui/material';

export const DAY_FIELDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const DAY_LABELS = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

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
          variant='standard'
          size='small'
          value={row.jobNumber ?? ''}
          onChange={(e) => onChange('jobNumber', e.target.value)}
        />
      </TableCell>
      <TableCell sx={{ minWidth: '7rem' }}>
        <TextField
          variant='standard'
          size='small'
          value={row.name ?? ''}
          onChange={(e) => onChange('name', e.target.value)}
        />
      </TableCell>
      <TableCell sx={{ minWidth: '7rem' }}>
        <TextField
          variant='standard'
          size='small'
          value={row.assignedDriver ?? ''}
          onChange={(e) => onChange('assignedDriver', e.target.value)}
        />
      </TableCell>
      <TableCell sx={{ minWidth: '8rem' }}>
        <TextField
          variant='standard'
          size='small'
          value={row.coverReason ?? ''}
          onChange={(e) => onChange('coverReason', e.target.value)}
        />
      </TableCell>
      {DAY_FIELDS.map((field) => (
        <TableCell key={field} sx={{ minWidth: '4.5rem' }}>
          <TextField
            variant='standard'
            size='small'
            value={row[field] ?? ''}
            onChange={(e) => onChange(field, e.target.value)}
          />
        </TableCell>
      ))}
      <TableCell sx={{ minWidth: '16rem' }}>
        <TextField
          variant='standard'
          size='small'
          fullWidth
          value={row.description ?? ''}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </TableCell>
    </>
  );
}
