'use client';

import Link from '@/components/utility/NextLink';
import { Box, Link as MuiLink, Typography } from '@mui/material';

import { ACTIVITY_KINDS } from '@/constants';
import { softInset } from '@/components/utility/soft';
import { formatWhen } from './format';

const KIND_LABELS = Object.fromEntries(ACTIVITY_KINDS.map((kind) => [kind.key, kind.label]));

// Rows of the super admin's activity feed (lib/db/activity.js), in one inset
// well: what happened, then when and what kind. Text from drivers (tip and
// comment snippets) arrives as plain text and is rendered as text.
export default function ActivityList({ rows, emptyText = 'Nothing yet.' }) {
  if (rows.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary'>
        {emptyText}
      </Typography>
    );
  }
  return (
    <Box
      component='ol'
      sx={[
        softInset,
        {
          listStyle: 'none',
          m: 0,
          p: { xs: 1.5, sm: 2 },
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        },
      ]}
    >
      {rows.map((row) => (
        <Box component='li' key={row.id} sx={{ minWidth: 0 }}>
          <Typography variant='body2' sx={{ overflowWrap: 'anywhere' }}>
            {row.href ? (
              <MuiLink component={Link} href={row.href} color='inherit' underline='hover'>
                {row.text}
              </MuiLink>
            ) : (
              row.text
            )}
          </Typography>
          <Typography variant='caption' color='text.secondary' component='p'>
            <time dateTime={row.at}>{formatWhen(row.at)}</time> · {KIND_LABELS[row.kind] ?? row.kind}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
