import { serializeSlics } from '@/utils/functions';
import { getAllSlics } from '@/utils/slicsApi';
import { Typography } from '@mui/material';

import SlicsTable from '../../components/admin/SlicsTable';
import PageContainer from '../../components/layout/PageContainer';
import BackButton from '@/app/components/layout/BackButton';
import { auth } from '@/auth';
import RedirectMessage from '../RedirectMessage';

async function SlicsTablePage() {
  const session = await auth();

  if (!session) {
    // If the user is not authenticated, redirect them to the sign-in page
    return (
      <RedirectMessage
        message='You must be logged in to access this page.'
        redirect='/signin'
      />
    );
  }
  const user = session.user;
  const isAdmin = user && user.role === 'admin';
  if (!isAdmin) {
    // If the user is not authenticated or not an admin, redirect them
    return (
      <RedirectMessage
        message='You must be an admin to access this page.'
        redirect='/home'
      />
    );
  }
  const slics = await getAllSlics();

  return (
    <>
      <BackButton />
      <Typography variant='h2'>Slics</Typography>

      <SlicsTable slics={serializeSlics(slics)} />
    </>
  );
}

export default SlicsTablePage;
