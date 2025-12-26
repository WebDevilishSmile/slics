import { CircularProgress, Typography } from '@mui/material';

import PageContainer from './PageContainer';

function LoadingFallback() {
  return (
    <PageContainer>
      <Typography variant='h6' sx={{ p: '1rem' }}>
        Loading...
      </Typography>
      <CircularProgress sx={{ p: '1rem' }} size='3rem' />
    </PageContainer>
  );
}

export default LoadingFallback;
