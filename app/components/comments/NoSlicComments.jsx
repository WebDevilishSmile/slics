import { Paper, Typography } from '@mui/material';

function NoSlicComments() {
  return (
    <Paper variant='panel' sx={{ position: 'relative', px: 2 }}>
      <Typography variant='h4' sx={{ textAlign: 'center', mb: 2 }}>
        Comments
      </Typography>
      <Typography sx={{ mt: 2 }}>
        Please select a SLIC to view comments.
      </Typography>
    </Paper>
  );
}

export default NoSlicComments;
