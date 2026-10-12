'use client';

import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';

import { PUSH_TYPES } from '@/constants';
import { apiRequest } from '@/lib/apiRequest';
import { softInset, softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { formatWhen, plural } from './format';

const TYPE_LABELS = Object.fromEntries(PUSH_TYPES.map((type) => [type.key, type.label]));

const sourceLabel = (row) => {
  if (row.source === 'test') return `Test${row.by ? ` by ${row.by.name}` : ''}`;
  if (row.source === 'sample') return `Sample of ${TYPE_LABELS[row.type] ?? row.type}${row.by ? ` for ${row.by.name}` : ''}`;
  if (row.source === 'compose') return `Written${row.by ? ` by ${row.by.name}` : ''}`;
  return TYPE_LABELS[row.type] ?? 'Notification';
};

// The push send log on /admin/super/notifications (lib/db/pushLog.js): what
// went out, to how many devices, and what failed, newest first, kept 90 days.
// "Delivered" means the push service took it; whether the phone showed it
// can't be known (docs/PUSH-NOTIFICATIONS.md, "Worth knowing").
export default function PushLogList({ initial }) {
  const [rows, setRows] = useState(initial.rows);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMore = async () => {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await apiRequest(
      `/api/push-log?before=${encodeURIComponent(rows.at(-1)._id)}`,
      { method: 'GET' },
    );
    setLoading(false);
    if (loadError) return setError(loadError);
    setRows((current) => [...current, ...data.data.rows]);
    setHasMore(data.data.hasMore);
  };

  if (rows.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary'>
        Nothing sent yet. Every send that reaches a device is listed here for 90 days.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        component='ol'
        sx={[
          softInset,
          { listStyle: 'none', m: 0, p: { xs: 1.5, sm: 2 }, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 1.5 },
        ]}
      >
        {rows.map((row) => (
          <Box component='li' key={row._id} sx={{ minWidth: 0 }}>
            <Typography variant='body2' sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
              {row.title || 'Untitled'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {sourceLabel(row)} · {plural(row.devices, 'device')}
              {row.devices > 0 && `, ${row.sent} delivered`}
              {row.failed > 0 && `, ${row.failed} failed`}
              {row.gone > 0 && ` (${plural(row.gone, 'device')} gone, removed)`}
            </Typography>
            {row.errors.length > 0 && (
              <Typography variant='caption' color='error' component='p'>
                {row.errors.map((failure) => `${failure.host}${failure.status ? ` ${failure.status}` : ''}`).join(', ')}
              </Typography>
            )}
            <Typography variant='caption' color='text.secondary' component='p'>
              <time dateTime={row.at}>{formatWhen(row.at)}</time>
            </Typography>
          </Box>
        ))}
      </Box>
      {error && <Alert severity='error'>{error}</Alert>}
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={loadMore}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color='inherit' /> : null}
            sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
          >
            {loading ? 'Loading…' : 'Load more'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
