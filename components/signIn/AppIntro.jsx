import theme from '@/theme';
import { Box, Link, Typography } from '@mui/material';
import { softRaised } from '@/components/utility/soft';

const features = [
  'Enter a SLIC code to get the destination’s address, with a tap-to-open map link.',
  'Call the location with one tap.',
  'Read and share tips from other drivers about that location: where to park, which door, what to watch for.',
];

// What `/` says about the app to a signed-out visitor, before and after the
// sign-in panel. Google's OAuth branding review reads this page and rejects
// a home page that doesn't explain the app's purpose or what it does with
// Google sign-in, so keep both here and keep it public (middleware.js).
export function AppTagline() {
  return (
    <Typography
      variant='body1'
      sx={{
        textAlign: 'center',
        maxWidth: theme.layout.width.prose,
        mx: 'auto',
        mb: 3,
      }}
    >
      SLICs is a lookup app for UPS Feeder drivers. Enter a SLIC code and get
      the destination’s address, map link and phone number, so you don’t have
      to dig through the paper binder.
    </Typography>
  );
}

export function AppIntro() {
  return (
    <Box
      component='section'
      aria-labelledby='app-intro-heading'
      className='enter'
      sx={[
        softRaised(theme),
        {
          width: '100%',
          maxWidth: theme.layout.width.prose,
          mt: 4,
          px: { xs: 3, sm: 4 },
          py: 3,
          borderRadius: 3,
        },
      ]}
    >
      <Typography
        id='app-intro-heading'
        variant='h5'
        component='h2'
        sx={{ textAlign: 'center', mb: 2 }}
      >
        What SLICs is
      </Typography>
      <Typography variant='body1' component='ul' sx={{ pl: 3, my: 0 }}>
        {features.map((feature) => (
          <Box component='li' key={feature} sx={{ mb: 1 }}>
            {feature}
          </Box>
        ))}
      </Typography>

      <Typography variant='h6' component='h3' sx={{ mt: 3, mb: 1 }}>
        Why you sign in
      </Typography>
      <Typography variant='body1'>
        An account keeps the app for drivers and lets you post tips under your
        name. If you sign in with Google, SLICs receives only your name, email
        address and profile picture. They’re used to create your account and
        show your first name and picture on the tips you post. SLICs never
        sells them and doesn’t access anything else in your Google account.
      </Typography>
      <Typography variant='body1' sx={{ mt: 2 }}>
        Read the <Link href='/privacy'>Privacy Policy</Link> and the{' '}
        <Link href='/terms'>Terms of Service</Link>. SLICs is an independent
        project, not made or endorsed by UPS.
      </Typography>
    </Box>
  );
}
