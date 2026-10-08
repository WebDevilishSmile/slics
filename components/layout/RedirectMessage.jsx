'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Paper, Typography } from '@mui/material';
import PageContainer from './PageContainer';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

function RedirectMessage({
  heading = 'You are already signed in.',
  subheading = 'Redirecting you to the home page…',
  redirect = '/',
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirect);
    }, 500); // Redirect after 0.5 second
    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [router, redirect]);

  return (
    <PageContainer>
      <Typography variant='sectionHeading'>{heading}</Typography>
      <Paper
        variant='panel'
        className='enter'
        sx={{ minHeight: 0, gap: 3, textAlign: 'center' }}
      >
        <Typography>{subheading}</Typography>
        <Typography variant='body2' color='text.secondary'>
          If you are not redirected automatically:
        </Typography>
        <Button
          href={redirect}
          sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
        >
          Continue
        </Button>
      </Paper>
    </PageContainer>
  );
}

export default RedirectMessage;
