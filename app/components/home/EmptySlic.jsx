import { ELEVATION, MAX_WIDTH, MIN_HEIGHT } from '@/utils/variables';
import { CoffeeOutlined } from '@mui/icons-material';
import { Button, Paper, Typography } from '@mui/material';

function EmptySlic() {
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
        py: '2rem',
        px: '2rem',
      }}
    >
      <Typography variant='h4' sx={{ textAlign: 'center', mb: '1.5rem' }}>
        Please choose a SLIC to view details
      </Typography>

      <Typography>
        I put a lot of work into making this app. Countless hours went into the
        design, development, and testing. Thank you for your support! If you
        have any feedback or suggestions, please reach out!
      </Typography>

      <Button
        variant='contained'
        href='mailto:webdevilishsmile@gmail.com'
        sx={{ mt: '1rem' }}
      >
        Email me
      </Button>
    </Paper>
  );
}

export default EmptySlic;
