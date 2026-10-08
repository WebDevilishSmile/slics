'use client';

import { Box, Stack, TextField } from '@mui/material';
import { DAY_FIELDS, DAY_LABELS } from '@/lib/dayFormat';
import { softInputSx, softRaised } from '@/components/utility/soft';

export default function CoverBidJobEditCard({ row, onChange, actions }) {
  return (
    <Box sx={[softRaised, { p: 2 }]}>
      <Stack spacing={2}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <TextField
            label='Job #'
            size='small'
            value={row.jobNumber ?? ''}
            onChange={(e) => onChange('jobNumber', e.target.value)}
            sx={[softInputSx, { maxWidth: '8rem' }]}
          />
          {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
        </Box>

        <TextField
          label='Cover Reason'
          size='small'
          fullWidth
          value={row.coverReason ?? ''}
          onChange={(e) => onChange('coverReason', e.target.value)}
          sx={softInputSx}
        />

        <Stack direction='row' spacing={1.5}>
          <TextField
            label='Name'
            size='small'
            fullWidth
            value={row.name ?? ''}
            onChange={(e) => onChange('name', e.target.value)}
            sx={softInputSx}
          />
          <TextField
            label='Assigned Driver'
            size='small'
            fullWidth
            value={row.assignedDriver ?? ''}
            onChange={(e) => onChange('assignedDriver', e.target.value)}
            sx={softInputSx}
          />
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
            gap: 1.5,
          }}
        >
          {DAY_FIELDS.map((field) => (
            <TextField
              key={field}
              label={DAY_LABELS[field]}
              size='small'
              value={row[field] ?? ''}
              onChange={(e) => onChange(field, e.target.value)}
              sx={softInputSx}
            />
          ))}
        </Box>

        <TextField
          label='Description'
          size='small'
          fullWidth
          multiline
          minRows={2}
          value={row.description ?? ''}
          onChange={(e) => onChange('description', e.target.value)}
          sx={softInputSx}
        />
      </Stack>
    </Box>
  );
}
