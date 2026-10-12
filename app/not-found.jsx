import theme from '@/theme';
import { Button, Paper, Typography } from '@mui/material';
import PageContainer from '@/components/layout/PageContainer';
import AnimatedSlicsMark from '@/components/utility/AnimatedSlicsMark';
import { softContainedSx } from '@/components/utility/soft';

// No automatic redirect: it used to send drivers to / after 2 seconds, before
// they could read why, and cut the mark off mid-question. The button is the
// way back.
function NotFound() {
  return (
    <PageContainer>
      <Typography variant='sectionHeading'>Oops! Page not found.</Typography>

      <Paper
        variant='panel'
        className='enter'
        sx={{ minHeight: 0, gap: 3, textAlign: 'center' }}
      >
        <AnimatedSlicsMark sx={{ fontSize: '5rem' }} />
        <Typography>
          Sorry, we couldn&apos;t find the page you&apos;re looking for. The
          link may be old, or the page may have moved.
        </Typography>
        <Button
          variant='contained'
          href='/'
          sx={[softContainedSx(theme), { px: 3, minHeight: '3rem' }]}
        >
          Go to Home
        </Button>
      </Paper>
    </PageContainer>
  );
}

export default NotFound;
