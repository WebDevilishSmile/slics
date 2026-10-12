import theme from '@/theme';
import { Box, Link, Typography } from '@mui/material';
import { softInset, softRaised } from '@/components/utility/soft';
import OpenAppButton from './OpenAppButton';

const STEPS = [
  {
    title: 'Make a free account',
    text: 'Sign in with Google, or create an account with your email and a password.',
    signedOutOnly: true,
  },
  {
    title: 'Type a SLIC code',
    text: 'The address, directions, phone number and tips come up right away.',
  },
  {
    title: 'Add it to your home screen',
    text: 'SLICs then opens like any other app on your phone.',
  },
];

// The last section of `/`: the steps, then the page's button again so the
// page ends on the action. A signed-in driver already has an account, so their
// list starts at the SLIC code.
export default function GetStarted({ signedIn }) {
  const steps = STEPS.filter((step) => !(signedIn && step.signedOutOnly));

  return (
    <Box
      component='section'
      id='get-started'
      aria-labelledby='get-started-heading'
      className='enter'
      sx={[
        softRaised(theme),
        {
          width: '100%',
          maxWidth: theme.layout.width.prose,
          mt: 4,
          mb: 2,
          px: { xs: 3, sm: 4 },
          py: 3,
          borderRadius: 4,
          scrollMarginTop: '6rem', // clear of the fixed header (Hero's button)
        },
      ]}
    >
      <Typography
        variant='h5'
        component='h2'
        id='get-started-heading'
        sx={{ textAlign: 'center', mb: 3 }}
      >
        Get started in a minute
      </Typography>
      <Box
        component='ol'
        sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 2.5 }}
      >
        {steps.map(({ title, text }, i) => (
          <Box
            component='li'
            key={title}
            sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}
          >
            <Box
              aria-hidden
              sx={[
                softInset(theme),
                {
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.main',
                  typography: 'subtitle1',
                  fontWeight: 700,
                },
              ]}
            >
              {i + 1}
            </Box>
            <Box>
              <Typography variant='subtitle1' component='h3' sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {text}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          mt: 4,
        }}
      >
        <OpenAppButton signedIn={signedIn} />
        <Typography variant='body2' sx={{ textAlign: 'center' }}>
          Step-by-step guides are on the <Link href='/help'>Help page</Link>.
        </Typography>
      </Box>
    </Box>
  );
}
