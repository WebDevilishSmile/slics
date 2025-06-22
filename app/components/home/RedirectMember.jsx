'use client';

import { CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PageContainer from '../layout/PageContainer';

function RedirectMember({ userName }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/home');
    }, 3000); // Redirect after 3 seconds
    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [router]);

  return (
    <PageContainer>
      <Typography variant='h2' sx={{ textAlign: 'center', my: '2rem' }}>
        Welcome back {userName}
      </Typography>
      <Typography sx={{ my: '2rem', textAlign: 'center' }}>
        Redirecting you to the home page...
      </Typography>
      <CircularProgress size='3rem' />
    </PageContainer>
  );
}

export default RedirectMember;
