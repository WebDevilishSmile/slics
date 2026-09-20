import { CircularProgress, Typography } from '@mui/material';

import PageContainer from './PageContainer';

function LoadingFallback() {
  return (
    <PageContainer>
      <Typography variant='h6' sx={{ p: 2 }}>
        Loading...
      </Typography>
      <CircularProgress sx={{ p: 2 }} size='3rem' />
    </PageContainer>
  );
}

export default LoadingFallback;
