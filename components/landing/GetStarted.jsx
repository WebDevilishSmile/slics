import theme from '@/theme';
import { Box, Link, Typography } from '@mui/material';
import { softInset, softRaised } from '@/components/utility/soft';

const STEPS = [
  {
    title: 'Make a free account',
    text: 'Sign in with Google, or create an account with your email and a password.',
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

export default function GetStarted() {
  return (
    <Box
      component='section'
      aria-labelledby='get-started-heading'
      className='enter'
      sx={[
        softRaised(theme),
        {
          width: '100%',
          maxWidth: theme.layout.width.prose,
          mt: 6,
          px: { xs: 3, sm: 4 },
          py: 3,
          borderRadius: 4,
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
        {STEPS.map(({ title, text }, i) => (
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
      <Typography variant='body2' sx={{ mt: 3, textAlign: 'center' }}>
        Step-by-step guides are on the{' '}
        <Link href='/help'>Help page</Link>.
      </Typography>
    </Box>
  );
}
