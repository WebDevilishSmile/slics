import { ELEVATION, MAX_WIDTH, MIN_HEIGHT } from '@/utils/variables';
import { Box, Button, Paper, Typography } from '@mui/material';
import Image from 'next/image';
import BuyMeACoffeeButton from '../layout/BuyMeACoffeeButton';
import MemberDisplay from './MemberDisplay';

function EmptySlic({ user }) {
  const OPTIONS = { loop: true, align: 'center' };
  const SLIDE_COUNT = 4;
  const SLIDES = Array.from(Array(SLIDE_COUNT).keys());

  if (user?.bmcMember) {
    return <MemberDisplay user={user} />;
  }

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

      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Image
          src='/slics-logo.png'
          alt='SLICs Logo'
          width={100}
          height={100}
        />
      </Box>

      <Typography variant='body1' sx={{ textAlign: 'center', mt: 4 }}>
        Support me on BuyMeACoffee to keep SLICs running smoothly!
      </Typography>
      <BuyMeACoffeeButton />
    </Paper>
  );
}

export default EmptySlic;
