import theme from '@/utils/theme';
import { Paper, Typography } from '@mui/material';

function SlicDetailsContainer({ children, title = 'Slic Details' }) {
  return (
    <Paper
      elevation={theme.layout.elevation}
      sx={{
        width: '100%',
        maxWidth: theme.layout.maxWidth,
        minHeight: theme.layout.minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: '2rem',
        py: '2rem',
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
