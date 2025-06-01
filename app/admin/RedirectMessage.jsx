'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';

function RedirectMessage({
  message = 'You are already signed in. Redirecting you to the home page...',
  redirect = '/home',
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirect);
    }, 3000); // Redirect after 3 seconds
    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [router, redirect]);

  return (
    <PageContainer>
      <Typography variant='h2' sx={{ maxWidth: '55rem', textAlign: 'center' }}>
        {message}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: '2rem',
        }}
      >
        <Typography variant='body1'>
          If you are not redirected automatically, click
        </Typography>
        <Button variant='outlined' href={redirect} sx={{ ml: '.5rem' }}>
          here
        </Button>
      </Box>
    </PageContainer>
  );
}

export default RedirectMessage;
