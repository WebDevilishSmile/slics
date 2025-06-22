'use client';

import { MAX_WIDTH } from '@/utils/variables';
import { Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PageContainer from './components/layout/PageContainer';
import StyledHeading from './components/layout/StyledHeading';

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
      <StyledHeading>Oops! Page not found.</StyledHeading>

      <Typography sx={{ maxWidth: MAX_WIDTH, my: '2rem', textAlign: 'center' }}>
        Sorry, we couldn't find the page you're looking for. Redirecting you to
        the home page... If you are not redirected automatically, click the
        button below.
      </Typography>
      <Button variant='contained' color='primary' href='/'>
        Go to Home
      </Button>
    </PageContainer>
  );
}

export default NotFound;
