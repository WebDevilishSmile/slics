'use client';

import { Box, Button, Paper, Typography } from '@mui/material';
import { useEffect } from 'react';
import PageContainer from './components/layout/PageContainer';
import {
  softContainedSx,
  softPressSx,
  softRaisedSmall,
} from './components/utility/soft';

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

      <Paper
        variant='panel'
        className='enter'
        sx={{ minHeight: 0, gap: 3, textAlign: 'center' }}
      >
        <Typography>
          Sorry about that. Try the page again — if it keeps happening, head
          back to the home page and look the SLIC up from there.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Button
            variant='contained'
            onClick={() => reset()}
            sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
          >
            Try again
          </Button>
          {/* A plain link on purpose: after a crash, a full reload is the
              surest way back to a clean app (the theme defaults to next/link). */}
          <Button
            href='/'
            LinkComponent='a'
            sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
          >
            Go to Home
          </Button>
        </Box>

        {/* In production Next.js replaces server error messages with a digest;
            showing it lets a driver quote something useful when reporting. */}
        {error?.digest && (
          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
            Error reference: {error.digest}
          </Typography>
        )}
      </Paper>
    </PageContainer>
  );
}

export default Error;
