import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

function formatUser(userStamp) {
  if (!userStamp) return 'Unknown';
  return userStamp.name || userStamp.email || 'Unknown';
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === '') return '(empty)';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function SlicHistoryList({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <Box sx={{ width: '100%', maxWidth: '30rem', mt: '3rem' }}>
      <Typography variant='h6' sx={{ mb: '1rem' }}>
        Change History
      </Typography>

      {history.map((entry) => (
        <Box
          key={entry._id}
          sx={{
            mb: '1rem',
            pb: '1rem',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant='body2'>
            <strong>{entry.action === 'created' ? 'Created' : 'Updated'}</strong>{' '}
            by {formatUser(entry.user)} on{' '}
            {dayjs(entry.timestamp).format('MM/DD/YY [at] h:mm A')}
          </Typography>

          {entry.changes?.length > 0 && (
            <Box component='ul' sx={{ mt: '0.5rem', mb: 0, pl: '1.5rem' }}>
              {entry.changes.map((change) => (
                <Typography
                  component='li'
                  variant='body2'
                  color='text.secondary'
                  key={change.field}
                >
                  {change.field}: {formatFieldValue(change.from)} →{' '}
                  {formatFieldValue(change.to)}
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
