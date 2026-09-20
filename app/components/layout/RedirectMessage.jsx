'use client';

import theme from '@/utils/theme';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Box, Button, Typography } from '@mui/material';
import PageContainer from './PageContainer';

function RedirectMessage({
  heading = 'You are already signed in.',
  subheading = 'Redirecting you to the home page...',
  redirect = '/',
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirect);
    }, 2500); // Redirect after 2.5 seconds
    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [router, redirect]);

  return (
    <PageContainer>
      <Typography
        variant='h2'
        sx={{ maxWidth: theme.layout.width.wide, textAlign: 'center', px: 2 }}
      >
        {heading}
      </Typography>
      <Typography
        variant='h6'
        sx={{ maxWidth: theme.layout.width.wide, textAlign: 'center', mt: 2, px: 2 }}
      >
        {subheading}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 4,
        }}
      >
        <Typography
          variant='body1'
          sx={{
            maxWidth: theme.layout.width.wide,
            textAlign: 'center',
            mt: 2,
            px: 2,
          }}
        >
          If you are not redirected automatically,
        </Typography>
        <Button variant='outlined' href={redirect} sx={{ ml: 1 }}>
          click here
        </Button>
      </Box>
    </PageContainer>
  );
}

export default RedirectMessage;
