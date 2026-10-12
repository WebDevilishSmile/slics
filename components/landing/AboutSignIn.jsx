import theme from '@/theme';
import { Box, Link, Typography } from '@mui/material';
import { softRaised } from '@/components/utility/soft';

// Why the app asks you to sign in and what it gets from Google. Google's OAuth
// branding review reads `/` and rejects a home page that doesn't say this, so
// keep it here, keep `/` public (middleware.js), and keep it in line with the
// privacy policy.
export default function AboutSignIn() {
  return (
    <Box
      component='section'
      aria-labelledby='about-sign-in-heading'
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
        },
      ]}
    >
      <Typography
        variant='h5'
        component='h2'
        id='about-sign-in-heading'
        sx={{ textAlign: 'center', mb: 2 }}
      >
        Why you sign in
      </Typography>
      <Typography variant='body1'>
        An account keeps SLICs for drivers and lets you post tips under your
        name. If you sign in with Google, SLICs receives only your name, email
        address and profile picture. They’re used to create your account and
        to show your first name and picture on the tips you post. SLICs never
        sells them and doesn’t access anything else in your Google account.
      </Typography>
      <Typography variant='body1' sx={{ mt: 2 }}>
        Read the <Link href='/privacy'>Privacy Policy</Link> and the{' '}
        <Link href='/terms'>Terms of Service</Link>. SLICs is an independent
        project by a Feeder driver, not made or endorsed by UPS.
      </Typography>
    </Box>
  );
}
