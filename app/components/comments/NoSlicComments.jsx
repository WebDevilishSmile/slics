import theme from '@/utils/theme';
import { Paper, Typography } from '@mui/material';

function NoSlicComments() {
  return (
    <Paper
      elevation={theme.layout.elevation}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: theme.layout.maxWidth,
        minHeight: theme.layout.minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: '2rem',
        py: '2rem',
        px: '1rem',
      }}
    >
      <Typography variant='h4' sx={{ textAlign: 'center', mb: '1rem' }}>
        Comments
      </Typography>
      <Typography sx={{ mt: '1rem' }}>
        Please select a SLIC to view comments.
      </Typography>
    </Paper>
  );
}

export default NoSlicComments;
