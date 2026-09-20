import theme from '@/utils/theme';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

function formatUser(userStamp) {
  if (!userStamp) return 'Unknown';
  return userStamp.name || userStamp.email || 'Unknown';
}

function SlicAuditInfo({ slic }) {
  if (!slic?.createdBy && !slic?.updatedBy) return null;

  return (
    <Box sx={{ width: '100%', maxWidth: theme.layout.width.field, mb: 2 }}>
      {slic.createdBy && (
        <Typography variant='body2' color='text.secondary'>
          Created by {formatUser(slic.createdBy)}
          {slic.created_at &&
            ` on ${dayjs(slic.created_at).format('MM/DD/YY [at] h:mm A')}`}
        </Typography>
      )}
      {slic.updatedBy && (
        <Typography variant='body2' color='text.secondary'>
          Last edited by {formatUser(slic.updatedBy)}
          {slic.updated_at &&
            ` on ${dayjs(slic.updated_at).format('MM/DD/YY [at] h:mm A')}`}
        </Typography>
      )}
    </Box>
  );
}

export default SlicAuditInfo;
