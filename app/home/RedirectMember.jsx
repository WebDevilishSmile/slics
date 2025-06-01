'use client';

import { CircularProgress, Typography } from '@mui/material';
import PageContainer from '../components/layout/PageContainer';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
      <Typography variant='h2'>Welcome back {userName}</Typography>
      <Typography sx={{ my: '2rem' }}>
        Redirecting you to the home page...
      </Typography>
      <CircularProgress size='3rem' />
    </PageContainer>
  );
}

export default RedirectMember;
