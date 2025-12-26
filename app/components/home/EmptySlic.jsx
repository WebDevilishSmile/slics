import { ELEVATION, MAX_WIDTH, MIN_HEIGHT } from '@/utils/variables';
import { Button, Paper, Typography } from '@mui/material';
import EmblaCarousel from './EmblaCarousel';

function EmptySlic() {
  const OPTIONS = { loop: true, align: 'center' };
  const SLIDE_COUNT = 4;
  const SLIDES = Array.from(Array(SLIDE_COUNT).keys());

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
      <Typography variant='h5' sx={{ textAlign: 'center', mb: '1rem' }}>
        Welcome to SLICs 5.0
      </Typography>

      <Typography variant='caption'>Coming soon</Typography>
      <Button
        disabled
        variant='contained'
        // href='https://gofund.me/52ffdb875'
        sx={{ mb: '1rem' }}
      >
        Watch Tutorial
      </Button>
      <EmblaCarousel slides={SLIDES} options={OPTIONS} />

      <Typography variant='body2' sx={{ mt: '1rem', textAlign: 'center' }}>
        Use the search bar above to find SLICs by numerical SLIC, alphabetical
        SLIC, or customer name. Interact with comments shared by users like you!
      </Typography>
    </Paper>
  );
}

export default EmptySlic;
