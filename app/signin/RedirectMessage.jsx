'use client';

import { Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';

function RedirectMessage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000); // Redirect after 3 seconds
    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [router]);

  return (
    <PageContainer>
      <Typography variant='h2'>Already Signed In</Typography>
      <Typography sx={{ my: '2rem' }}>
        You are already signed in. Redirecting you to the home page...
      </Typography>
    </PageContainer>
  );
}

export default RedirectMessage;
