import { CircularProgress, Typography } from '@mui/material';
import PageContainer from './components/layout/PageContainer';

function loading() {
  return (
    <PageContainer>
      <Typography variant='h2'>Loading...</Typography>
      <CircularProgress size='5rem' sx={{ mt: '2rem' }} />
    </PageContainer>
  );
}

export default loading;
