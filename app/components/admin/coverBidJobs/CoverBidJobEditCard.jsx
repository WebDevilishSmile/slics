'use client';

import { Box, Card, CardContent, Stack, TextField } from '@mui/material';
import { DAY_FIELDS, DAY_LABELS } from '@/app/components/coverBidJobs/dayFormat';

export default function CoverBidJobEditCard({ row, onChange, actions }) {
  return (
    <Card variant='outlined'>
      <CardContent>
        <Stack spacing={1.5}>
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
              variant='outlined'
              size='small'
              value={row.jobNumber ?? ''}
              onChange={(e) => onChange('jobNumber', e.target.value)}
              sx={{ maxWidth: '8rem' }}
            />
            {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
          </Box>

          <TextField
            label='Cover Reason'
            variant='outlined'
            size='small'
            fullWidth
            value={row.coverReason ?? ''}
            onChange={(e) => onChange('coverReason', e.target.value)}
          />

          <Stack direction='row' spacing={1.5}>
            <TextField
              label='Name'
              variant='outlined'
              size='small'
              fullWidth
              value={row.name ?? ''}
              onChange={(e) => onChange('name', e.target.value)}
            />
            <TextField
              label='Assigned Driver'
              variant='outlined'
              size='small'
              fullWidth
              value={row.assignedDriver ?? ''}
              onChange={(e) => onChange('assignedDriver', e.target.value)}
            />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
              gap: 1,
            }}
          >
            {DAY_FIELDS.map((field) => (
              <TextField
                key={field}
                label={DAY_LABELS[field]}
                variant='outlined'
                size='small'
                value={row[field] ?? ''}
                onChange={(e) => onChange(field, e.target.value)}
              />
            ))}
          </Box>

          <TextField
            label='Description'
            variant='outlined'
            size='small'
            fullWidth
            multiline
            minRows={2}
            value={row.description ?? ''}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
