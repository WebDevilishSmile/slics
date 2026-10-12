import { Button, Paper, Typography } from '@mui/material';
import theme from '@/theme';
import BmcButton from '@/components/layout/BmcButton';
import ImpactLine from '@/components/support/ImpactLine';
import RefreshOnReturn from './RefreshOnReturn';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// The membership prompt on /sign-in, for a signed-in non-member who opened a
// members' page (/history; middleware.js). What membership unlocks, why it
// matters, then the Buy Me a Coffee button as the panel's one solid button
// and a soft way on. `next` is where "Use SLICs now" goes.
function Membership({ firstName, next = '/home' }) {
  return (
    <Paper
      variant='panel'
      className='enter'
      sx={{ minHeight: 0, textAlign: 'center', gap: 3, px: { xs: 3, sm: 4 } }}
    >
      <Typography variant='body1'>
        Hi {firstName}. Membership on Buy Me a Coffee unlocks History: every
        SLIC you&apos;ve looked up, with your own notes.
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        It also keeps SLICs going. I&apos;ve put many hours into building this
        app and keeping its addresses reliable.
      </Typography>

      <ImpactLine />

      <BmcButton />
      <RefreshOnReturn />

      <Typography variant='body2'>
        Not now? Looking up SLICs and reading tips stay free.
      </Typography>
      <Button
        href={next}
        sx={[
          softRaisedSmall(theme),
          softPressSx(theme),
          { px: 3, minHeight: '3rem' },
        ]}
      >
        Use SLICs now
      </Button>
    </Paper>
  );
}

export default Membership;
