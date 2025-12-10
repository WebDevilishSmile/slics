import { ELEVATION, MAX_WIDTH, MIN_HEIGHT } from '@/utils/variables';
import { CoffeeOutlined } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';
import Image from 'next/image';

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
        Help Support a Fellow Feeder in Need
      </Typography>

      <Box sx={{ borderRadius: '1rem', overflow: 'hidden' }}>
        <Image
          src='/sakasitzFire.webp'
          alt='Description'
          width={500}
          height={300}
        />
      </Box>

      <Button
        variant='contained'
        href='https://gofund.me/52ffdb875'
        sx={{ mt: '1rem' }}
      >
        Donate
      </Button>
    </Paper>
  );
}

export default EmptySlic;
