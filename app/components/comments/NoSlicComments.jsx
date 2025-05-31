import { ELEVATION, MAX_WIDTH, MIN_HEIGHT } from '@/utils/variables';
import { Paper, Typography } from '@mui/material';

function NoSlicComments() {
  return (
    <Paper
      elevation={ELEVATION}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: MAX_WIDTH,
        minHeight: MIN_HEIGHT,
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
