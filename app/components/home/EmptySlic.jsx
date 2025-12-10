import { ELEVATION, MAX_WIDTH, MIN_HEIGHT } from '@/utils/variables';
import { CoffeeOutlined } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';
import Image from 'next/image';
import EmblaCarousel from './EmblaCarousel';

function EmptySlic() {
  const OPTIONS = { dragFree: true, loop: true };
  const SLIDE_COUNT = 5;
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
        BETPA Feeder in need
      </Typography>

      <Button
        variant='contained'
        href='https://gofund.me/52ffdb875'
        sx={{ mb: '1rem' }}
      >
        Help Dan
      </Button>
      <EmblaCarousel slides={SLIDES} options={OPTIONS} />

      <Typography variant='caption' sx={{ mt: '1rem', textAlign: 'center' }}>
        On Friday November 21st, 2025, our beloved BETPA feeder Dan Sakasitz
        suffered a devastating house fire that destroyed his home and all his
        belongings. Dan, his wife, and their three wonderful children have lost
        everything except the clothes on their backs. Dan has been a dedicated
        feeder since 2021. Now, he needs our help more than ever. Please
        consider donating to help Dan rebuild his life and continue his vital
        work with BETPA. Click on the link above to go the the GoFundMe page.
        Every little bit helps. Thank you for your generosity and support.
      </Typography>
    </Paper>
  );
}

export default EmptySlic;
