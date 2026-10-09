'use client';

import { Box, Typography } from '@mui/material';

import { softInset } from '@/components/utility/soft';

// job number (upper-cased) → [{ name, order, pick }], in the sheet's pick
// order, from the week's saved picks (docs/ON-CALL-SHEET-SYNC.md).
export function pickedByJob(picks) {
  const byJob = new Map();
  for (const row of picks?.rows ?? []) {
    row.picks.forEach((code, index) => {
      const job = code.trim().toUpperCase();
      if (!job) return;
      if (!byJob.has(job)) byJob.set(job, []);
      byJob.get(job).push({ name: row.name, order: row.order, pick: index + 1 });
    });
  }
  return byJob;
}

// Who picked this job, under the fields in the job dialog.
export default function PickedByList({ entries }) {
  return (
    <Box component='section' sx={{ mt: 3 }}>
      <Typography variant='subtitle1' component='h3' sx={{ fontWeight: 600 }}>
        Picked by
      </Typography>
      {entries.length === 0 ? (
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
          Nobody has picked this job yet.
        </Typography>
      ) : (
        <Box
          component='ol'
          sx={(theme) => ({
            ...softInset(theme),
            m: 0,
            mt: 1,
            py: 1.5,
            pr: 2,
            pl: 5,
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          })}
        >
          {entries.map((entry, index) => (
            <Box component='li' key={`${entry.name}-${index}`} sx={{ typography: 'body2' }}>
              {entry.name}
              <Box component='span' sx={{ color: 'text.secondary' }}>
                {' '}· pick #{entry.pick}
                {entry.order && ` · order ${entry.order}`}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
