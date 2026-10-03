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
    }, 500); // Redirect after 0.5 second
    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [router]);

  return (
    <PageContainer>
      <Typography variant='h2' sx={{ textAlign: 'center', my: 4 }}>
        Welcome back {userName}
      </Typography>
      <Typography sx={{ my: 4, textAlign: 'center' }}>
        Redirecting you to the home page...
      </Typography>
      <CircularProgress size='3rem' />
    </PageContainer>
  );
}

export default RedirectMember;
