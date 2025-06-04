'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PageContainer from './PageContainer';

function RedirectMessage({
  heading = 'You are already signed in.',
  subheading = 'Redirecting you to the home page...',
  redirect = '/home',
}) {
  const router = useRouter();

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     router.push(redirect);
  //   }, 3000); // Redirect after 3 seconds
  //   return () => clearTimeout(timer); // Cleanup the timer on component unmount
  // }, [router, redirect]);

  return (
    <PageContainer>
      <Typography
        variant='h2'
        sx={{ maxWidth: '55rem', textAlign: 'center', px: '1rem' }}
      >
        {heading}
      </Typography>
      <Typography
        variant='h6'
        sx={{ maxWidth: '55rem', textAlign: 'center', mt: '1rem', px: '1rem' }}
      >
        {subheading}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          mt: '2rem',
        }}
      >
        <Typography
          variant='body1'
          sx={{
            maxWidth: '55rem',
            textAlign: 'center',
            mt: '1rem',
            px: '1rem',
          }}
        >
          If you are not redirected automatically,
        </Typography>
        <Button variant='outlined' href={redirect} sx={{ ml: '.5rem' }}>
          click here
        </Button>
      </Box>
    </PageContainer>
  );
}

export default RedirectMessage;
