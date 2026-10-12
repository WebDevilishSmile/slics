import theme from '@/theme';
import { Box, Button, Link, Typography } from '@mui/material';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';
import OpenAppButton from './OpenAppButton';
import ProductPreview from './ProductPreview';

// The top of `/`: the name, what it's for, the one solid button with what
// Google sign-in shares right under it, and a picture of the lookup card
// (ProductPreview). Side by side from md up, stacked on a phone with the
// button above the picture so it stays in the first screen.
export default function Hero({ signedIn }) {
  return (
    <Box
      component='section'
      aria-labelledby='hero-heading'
      sx={{
        width: '100%',
        maxWidth: theme.layout.width.wide,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        alignItems: 'center',
        justifyItems: 'center',
        columnGap: 6,
        rowGap: 5,
        mt: { xs: 2, sm: 4 },
      }}
    >
      <Box
        className='enter'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: { xs: 'center', md: 'flex-start' },
          textAlign: { xs: 'center', md: 'left' },
          gap: 2,
          maxWidth: theme.layout.width.field,
        }}
      >
        <Typography variant='h1' id='hero-heading'>
          SLICs
        </Typography>
        <Typography variant='h5' component='p'>
          The Feeder binder, on your phone.
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          A lookup app for UPS Feeder drivers, made by one. Type the SLIC code
          of any hub or customer and get its address, directions and phone
          number, plus tips from drivers who’ve been there.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', md: 'flex-start' },
            gap: 2,
            mt: 1,
          }}
        >
          <OpenAppButton signedIn={signedIn} />
          {!signedIn && (
            <Button
              href='#get-started'
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
            Free to use. If you sign in with Google, SLICs gets only your name,
            email address and picture.{' '}
            <Link href='#about-sign-in'>Why you sign in</Link>
          </Typography>
        )}
      </Box>

      <Box
        className='enter'
        style={{ '--i': 2 }}
        sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <ProductPreview signedIn={signedIn} />
      </Box>
    </Box>
  );
}
