import PageContainer from '@/app/components/layout/PageContainer';
import { CircularProgress, Typography } from '@mui/material';

function loading() {
  return (
    <PageContainer>
      <Typography variant='h2'>Loading...</Typography>
      <CircularProgress size='5rem' sx={{ mt: 4 }} />
    </PageContainer>
  );
}

export default loading;
