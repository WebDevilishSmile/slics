import { Paper, Typography } from '@mui/material';

function SlicDetailsContainer({ children }) {
  return (
    <Paper
      sx={{
        width: '100%',
        maxWidth: '40rem',
        minHeight: '36rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: '2rem',
        py: '2rem',
        px: '1rem',
      }}
    >
      <Typography variant='h4' sx={{ textAlign: 'center', mb: '1rem' }}>
        Slic Details
      </Typography>
      {children}
    </Paper>
  );
}

export default SlicDetailsContainer;
