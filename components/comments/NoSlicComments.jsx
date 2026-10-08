import { Paper, Typography } from '@mui/material';

function NoSlicComments() {
  return (
    <Paper variant='panel' sx={{ px: 2, justifyContent: 'center', gap: 1 }}>
      <Typography variant='h4' component='h2' sx={{ fontWeight: 700 }}>
        Driver tips
      </Typography>
      <Typography color='text.secondary' sx={{ textAlign: 'center' }}>
        Look up a SLIC to see what other drivers say about it, and share what you know.
      </Typography>
    </Paper>
  );
}

export default NoSlicComments;
