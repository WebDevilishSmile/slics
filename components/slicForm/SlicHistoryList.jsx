'use client';

import theme from '@/theme';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { softInset } from '@/components/utility/soft';

function formatUser(userStamp) {
  if (!userStamp) return 'Unknown';
  return userStamp.name || userStamp.email || 'Unknown';
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === '') return '(empty)';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// A route's text is long, and its earlier versions are in the Route section
// above (slicForm/RouteEditor.jsx), so a route change reads as one line.
function describeChange(change) {
  if (change.field === 'route') {
    if (!change.to) return 'Route removed';
    return change.from ? 'Route changed' : 'Route added';
  }
  return `${change.field}: ${formatFieldValue(change.from)} → ${formatFieldValue(change.to)}`;
}

// A delete is on record since Dispatch can delete SLICs (lib/db/slics.js); it
// shows here when a SLIC with the same number is added again.
const ACTION_LABELS = { created: 'Created', updated: 'Updated', deleted: 'Deleted' };

function SlicHistoryList({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <Box sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 6 }}>
      <Typography variant='h6' sx={{ mb: 2 }}>
        Change History
      </Typography>

      {history.map((entry) => (
        <Box
          key={entry._id}
          sx={[softInset, { mb: 2, p: 2 }]}
        >
          <Typography variant='body2'>
            <strong>{ACTION_LABELS[entry.action] ?? 'Updated'}</strong>{' '}
            by {formatUser(entry.user)} on{' '}
            {dayjs(entry.timestamp).format('MM/DD/YY [at] h:mm A')}
          </Typography>

          {entry.changes?.length > 0 && (
            <Box component='ul' sx={{ mt: 1, mb: 0, pl: 3 }}>
              {entry.changes.map((change) => (
                <Typography
                  component='li'
                  variant='body2'
                  color='text.secondary'
                  key={change.field}
                >
                  {describeChange(change)}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}

export default SlicHistoryList;
