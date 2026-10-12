import theme from '@/theme';
import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';
import { softContainedSx, softPressSx, softRaised, softRaisedSmall } from '@/components/utility/soft';

// The top of `/`: the app icon, the name, what it's for, and the one solid
// button. A signed-in driver gets "Open SLICs" instead of "Sign in".
export default function Hero({ signedIn }) {
  return (
    <Box
      component='section'
      className='enter'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 2,
        maxWidth: theme.layout.width.prose,
        mt: { xs: 2, sm: 4 },
      }}
    >
      <Box
        sx={[
          softRaised(theme),
          { width: 96, height: 96, borderRadius: '24px', overflow: 'hidden' },
        ]}
      >
        <Image src='/slics-icon.svg' width={96} height={96} alt='' priority />
      </Box>
      <Typography variant='h1'>SLICs</Typography>
      <Typography variant='h5' component='p'>
        The Feeder binder, on your phone.
      </Typography>
      <Typography variant='body1' color='text.secondary'>
        SLICs is a lookup app for UPS Feeder drivers. Type a SLIC code and get
        the destination’s address, directions and phone number, plus tips from
        drivers who’ve been there.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 2,
          mt: 1,
        }}
      >
        <Button
          variant='contained'
          href={signedIn ? '/home' : '/sign-in'}
          sx={[softContainedSx(theme), { px: 4, minHeight: '3rem' }]}
        >
          {signedIn ? 'Open SLICs' : 'Sign in'}
        </Button>
        {!signedIn && (
          <Button
            href='/help#sign-in'
            sx={[
              softRaisedSmall(theme),
              softPressSx(theme),
              { px: 3, minHeight: '3rem' },
            ]}
          >
            How to get started
          </Button>
        )}
      </Box>
      {!signedIn && (
        <Typography variant='body2' color='text.secondary'>
          Free to use. Sign in with Google or an email and password.
        </Typography>
      )}
    </Box>
  );
}
