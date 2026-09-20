import { Paper, Typography } from '@mui/material';

function SlicDetailsContainer({ children, title = 'Slic Details' }) {
  return (
    <Paper variant='panel' sx={{ justifyContent: 'center' }}>
      <Typography variant='h4' sx={{ textAlign: 'center' }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export default SlicDetailsContainer;
