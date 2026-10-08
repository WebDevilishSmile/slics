'use client';

import { Button, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { softContainedSx } from '@/components/utility/soft';

function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 2000); // Redirect after 2 seconds
    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [router]);

  return (
    <PageContainer>
      <Typography variant='sectionHeading'>Oops! Page not found.</Typography>

      <Paper
        variant='panel'
        className='enter'
        sx={{ minHeight: 0, gap: 3, textAlign: 'center' }}
      >
        <Typography>
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          Redirecting you to the home page… If you are not redirected
          automatically, use the button below.
        </Typography>
        <Button
          variant='contained'
          href='/'
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          Go to Home
        </Button>
      </Paper>
    </PageContainer>
  );
}

export default NotFound;
