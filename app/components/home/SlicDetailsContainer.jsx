import { ELEVATION, MAX_WIDTH, MIN_HEIGHT } from '@/utils/variables';
import { Paper, Typography } from '@mui/material';

function SlicDetailsContainer({ children, title = 'Slic Details' }) {
  return (
    <Paper
      elevation={ELEVATION}
      sx={{
        width: '100%',
        maxWidth: MAX_WIDTH,
        minHeight: MIN_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: '2rem',
        py: '1rem',
        px: '2rem',
      }}
    >
      <Typography variant='h4' sx={{ textAlign: 'center' }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export default SlicDetailsContainer;
