import { Typography } from '@mui/material';
import PageContainer from './components/layout/PageContainer';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  return (
    <PageContainer>
      <Typography variant='h1'>SLICs</Typography>
    </PageContainer>
  );
}
