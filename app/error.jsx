'use client';

import theme from '@/utils/theme';
import { Box, Button, Typography } from '@mui/material';
import { useEffect } from 'react';
import PageContainer from './components/layout/PageContainer';

// Route-segment error boundary (Next.js App Router). Catches render errors
// anywhere below the root layout, so the header/footer stay up and the
// driver gets a way back instead of a blank screen. Errors thrown by the
// root layout itself fall through to global-error.jsx.
//
// Note: this only catches errors during rendering. A failed fetch inside an
// event handler still has to be handled where it's called.
function Error({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled page error:', error);
  }, [error]);

  return (
    <PageContainer>
      <Typography variant='sectionHeading'>Something went wrong.</Typography>

      <Typography
        sx={{ maxWidth: theme.layout.width.panel, my: 4, textAlign: 'center' }}
      >
        Sorry about that. Try the page again — if it keeps happening, head back
        to the home page and look the SLIC up from there.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant='contained' color='primary' onClick={() => reset()}>
          Try again
        </Button>
        <Button variant='outlined' color='primary' href='/'>
          Go to Home
        </Button>
      </Box>

      {/* In production Next.js replaces server error messages with a digest;
          showing it lets a driver quote something useful when reporting. */}
      {error?.digest && (
        <Typography
          variant='caption'
          sx={{ mt: 4, color: 'text.secondary', textAlign: 'center' }}
        >
          Error reference: {error.digest}
        </Typography>
      )}
    </PageContainer>
  );
}

export default Error;
