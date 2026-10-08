'use client';

import { Box, LinearProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { softInset } from '@/components/utility/soft';

// A signed-in member on `/` is on their way to `to` (/home, or the page they
// were headed for before signing in): a thin progress bar in
// a soft inset track shows the wait (router.push doesn't drive the header's
// navigation bar).
function RedirectMember({ userName, to = '/home' }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(to);
    }, 500); // Redirect after 0.5 second
    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [router, to]);

  return (
    <PageContainer>
      <Typography variant='sectionHeading' sx={{ mt: 4 }}>
        Welcome back {userName}
      </Typography>
      <Typography sx={{ my: 3, textAlign: 'center' }} color='text.secondary'>
        Taking you to SLIC lookup…
      </Typography>
      <Box
        sx={[softInset, { width: '12rem', p: 0.75, borderRadius: 999 }]}
        aria-hidden
      >
        <LinearProgress sx={{ borderRadius: 999 }} />
      </Box>
    </PageContainer>
  );
}

export default RedirectMember;
